import { useCallback, useEffect, useState } from "react";
import { networkStatus } from "../lib/backend";
import type { NetworkStatus } from "../types";
export function useNetworkStatus(){
  const [status,setStatus]=useState<NetworkStatus>({online:navigator.onLine,checkedAt:new Date().toISOString()});
  const [checking,setChecking]=useState(false);
  const refresh=useCallback(async()=>{setChecking(true);try{setStatus(await networkStatus())}catch{setStatus({online:navigator.onLine,checkedAt:new Date().toISOString()})}finally{setChecking(false)}},[]);
  useEffect(()=>{void refresh();const on=()=>void refresh();window.addEventListener("online",on);window.addEventListener("offline",on);const id=window.setInterval(refresh,15000);return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",on);window.clearInterval(id)}},[refresh]);
  return {status,checking,refresh};
}
