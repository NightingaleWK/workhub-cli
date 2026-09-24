import {expect,it,vi} from 'vitest';
import {ensureTrellis} from '../src/dependencies.js';

it('leaves an existing installation alone',async()=>{
 const consent=vi.fn(),install=vi.fn();
 expect(await ensureTrellis(()=>true,consent,install)).toBe('existing');
 expect(consent).not.toHaveBeenCalled();expect(install).not.toHaveBeenCalled();
});
it('installs only after consent and detects again',async()=>{
 const detect=vi.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(true);
 const install=vi.fn();
 expect(await ensureTrellis(detect,async()=>true,install)).toBe('installed');
 expect(install).toHaveBeenCalledOnce();expect(detect).toHaveBeenCalledTimes(2);
});
it('does not install when declined',async()=>{
 const install=vi.fn();
 await expect(ensureTrellis(()=>undefined,async()=>false,install)).rejects.toMatchObject({code:130});
 expect(install).not.toHaveBeenCalled();
});
it('propagates npm failure without reporting success',async()=>{
 await expect(ensureTrellis(()=>undefined,async()=>true,()=>{throw new Error('npm failed');})).rejects.toThrow('npm failed');
});
it('rejects installation that does not produce a discoverable launcher',async()=>{
 await expect(ensureTrellis(()=>undefined,async()=>true,()=>{})).rejects.toThrow('仍未找到');
});
