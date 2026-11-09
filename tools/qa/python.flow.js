// Real Pyodide/Worker integration. Downloads the pinned public runtime, never submits a form.
const checks=[],check=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const until=async(fn,ms=90000)=>{for(let n=0;n<ms;n+=100){if(fn())return true;await wait(100);}return !!fn();};
const setCode=code=>{$('#pyEditor').value=code;$('#pyEditor').dispatchEvent(new Event('input',{bubbles:true}));};
const run=async code=>{setCode(code);$('[data-action="console-run"]').click();return until(()=>$('#consoleBody').getAttribute('aria-busy')==='false');};
document.querySelector('[data-action="skip"]')?.click();await wait(120);document.querySelector('[data-action="enter"]')?.click();await wait(1800);
$('[data-action="console-open"]').click();
check('runtime loads under the strict CSP',await until(()=>$('#pyOut').dataset.state==='ready'&&!$('[data-action="console-run"]').disabled),$('#pyOut').textContent);
if(checks.some(c=>!c.pass))return {ok:false,notes:checks};
check('Python prints a real result',await run('print(6 * 7)')&&$('#pyOut').textContent.trim()==='42',$('#pyOut').textContent);
check('a package can be prepared',await run('import pandas as pd\nprint(pd.Series([1, 2, 3]).sum())')&&$('#pyOut').textContent.trim()==='6',$('#pyOut').textContent);
check('Python errors remain readable',await run('print(missing_audit_name)')&&$('#pyOut').textContent.includes('NameError'),$('#pyOut').textContent);
setCode('x = 2\ny = x + 3\nprint(y)');$('[data-action="console-debug"]').click();
check('debugger receives a real trace',await until(()=>!$('#dbg').hidden&&!$('[data-action="console-debug"]').disabled));
if(!$('#dbg').hidden){
 const targets=[...$('#dbg').querySelectorAll('button,input')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')||e.textContent.trim(),width:r.width,height:r.height};});
 check('all expanded debugger targets meet 44px',targets.every(r=>r.width>=43.5&&r.height>=43.5),targets);
 $('#dbg').scrollIntoView({block:'center',behavior:'instant'});await wait(400);await shot('python-debugger');
 const before=$('#dbgRange').value;$('[data-dbg="next"]').click();check('debugger advances',Number($('#dbgRange').value)>Number(before));
 const bp=$('[data-bp="2"]');bp.click();check('breakpoint toggles',bp.getAttribute('aria-pressed')==='true');
 $('#dbg').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));check('debugger keyboard Home',$('#dbgRange').value==='0');
 $('[data-dbg="exit"]').click();check('exit restores editor focus',$('#dbg').hidden&&document.activeElement===$('#pyEditor'));
}
const looping='while True:\n    pass';setCode(looping);$('[data-action="console-run"]').click();await wait(150);$('[data-action="console-stop"]').click();
check('stop terminates the session without losing code',await until(()=>!$('[data-action="console-run"]').disabled,5000)&&$('#pyEditor').value===looping);
check('a new session runs after stop',await run('print(43)')&&$('#pyOut').textContent.trim()==='43',$('#pyOut').textContent);
$('#consoleBody').scrollIntoView({block:'center',behavior:'instant'});await wait(400);await shot('python-recovered');
check('expanded console fits the viewport',document.documentElement.scrollWidth<=innerWidth);
return {ok:checks.every(c=>c.pass),notes:checks};
