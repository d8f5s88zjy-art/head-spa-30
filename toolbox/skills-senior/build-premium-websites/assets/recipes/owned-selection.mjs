import {createLatestResource} from './latest-resource.mjs';

function syncResult(result, label) {
  if (result && typeof result.then === 'function') {
    Promise.resolve(result).catch(() => {});
    throw new TypeError(`${label} must be synchronous`);
  }
}

// prepare owns partial allocation until it resolves; clean up before rejecting.
// adopt(value, claim) must store the value in its owner, then call claim() once.
// Once claimed, the application owns the value even if adopt subsequently throws.
// discard must detach/release only this unclaimed value, including partial attach.
// Shared caches require leases/reference counting supplied by the application.
export function createOwnedSelection(prepare, adopt, discard) {
  if (![prepare,adopt,discard].every(fn=>typeof fn==='function')) throw new TypeError('Need ownership callbacks');
  const loader=createLatestResource(async (request,{signal})=>{
    request.value=await prepare(request.input,{signal});
    request.prepared=true;
    return request;
  },request=>{
    let claimOpen=true;
    const claim=()=>{
      if (!claimOpen || request.claimed) throw new Error('Ownership must be claimed once inside synchronous adopt');
      request.claimed=true;
    };
    try {
      syncResult(adopt(request.value,claim),'adopt');
      if (!request.claimed) throw new Error('adopt must explicitly claim ownership');
    } finally {claimOpen=false;}
  });
  return {
    async run(input) {
      const request={input,value:undefined,prepared:false,claimed:false};
      try {return await loader.run(request);}
      finally {
        if (request.prepared && !request.claimed) {
          request.prepared=false;
          syncResult(discard(request.value),'discard');
        }
      }
    },
    cancel:()=>loader.cancel(),
    dispose:()=>loader.dispose()
  };
}
