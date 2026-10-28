// Shared helpers for the platform and the game engines.
export function fail(status,message){throw Object.assign(Error(message),{status});}
export const validIndex=(x,n)=>Number.isInteger(x)&&x>=0&&x<n;
// Plurality. Any tie (including zero votes) takes the tie option if given, otherwise the first tied option.
export function top(c,ids=[],tie){const max=Math.max(...c);const tied=c.map((n,i)=>n===max?i:-1).filter(i=>i>=0);const t=ids.indexOf(tie);return tied.length>1&&t>=0?t:tied[0];}
