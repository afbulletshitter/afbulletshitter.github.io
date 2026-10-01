const $=selector=>document.querySelector(selector);
const els={
  source:$('#sourceText'),preview:$('#previewText'),box:$('#fitBox'),paper:$('#paper'),
  shell:document.querySelector('.paper-shell'),count:$('#charCount'),
  estimate:$('#lineEstimate'),hint:$('#hint'),toast:$('#toast'),
  measurer:$('#measureBox'),phrase:$('#phraseInput'),
  replacement:$('#replacementInput'),ruleList:$('#ruleList'),search:$('#acronymSearch'),
  results:$('#acronymResults'),resultsMeta:$('#resultsMeta')
};

const FORM_WIDTH_MM=202.321;
const PAPER_WIDTH_PX=202.321*96/25.4;
const PAPER_HEIGHT_PX=192;
const LINE_LIMIT=10;
const NARROW_SPACE='\u2006';
const WIDE_SPACE='\u2004';
const FIELD_WIDTH_PX=FORM_WIDTH_MM*96/25.4;
const RULES_KEY='tighttype-abbreviation-rules';
const DEFAULT_RULES=[{from:'and',to:'&'}];
const SUGGESTIONS={and:'&',percent:'%',dollars:'$',hours:'hrs',million:'M',billion:'B'};
function makeId(){return globalThis.crypto&&typeof globalThis.crypto.randomUUID==='function'?globalThis.crypto.randomUUID():`tt-${Date.now()}-${Math.random().toString(36).slice(2)}`}

const tabs=[...document.querySelectorAll('.tool-tab')];
function selectTab(tab){
  tabs.forEach(item=>{
    const selected=item===tab;
    item.classList.toggle('active',selected);
    item.setAttribute('aria-selected',selected);
    item.tabIndex=selected?0:-1;
    document.getElementById(item.getAttribute('aria-controls')).hidden=!selected;
  });
  if(tab.id==='tab-1206')requestAnimationFrame(syncPaperScale);
}
tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectTab(tab));
  tab.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    selectTab(tabs[next]);tabs[next].focus();
  });
});

const ACRONYMS=[
  ['ABM','AIR BATTLE MANAGER'],['ACE','AGILE COMBAT EMPLOYMENT'],['AD','ACTIVE DUTY'],
  ['ADCON','ADMINISTRATIVE CONTROL'],['AFE','AIRCREW FLIGHT EQUIPMENT'],['AFFORGEN','AIR FORCE FORCE GENERATION'],
  ['AFI','AIR FORCE INSTRUCTION'],['AFMAN','AIR FORCE MANUAL'],['AFSC','AIR FORCE SPECIALTY CODE'],
  ['AFSO21','AIR FORCE SMART OPERATIONS FOR THE 21ST CENTURY'],['AGE','AEROSPACE GROUND EQUIPMENT'],
  ['AGR','ACTIVE GUARD RESERVE'],['AI','ARTIFICIAL INTELLIGENCE'],['ALQ','AIRMAN LEADERSHIP QUALITY'],
  ['ALS','AIRMAN LEADERSHIP SCHOOL'],['AOC','AIR OPERATIONS CENTER'],['AOR','AREA OF RESPONSIBILITY'],
  ['APF','APPROPRIATED FUNDS'],['ART','AIR RESERVE TECHNICIAN'],['AT','ANNUAL TOUR'],
  ['ATC','AIR TRAFFIC CONTROL'],['ATO','AIR TASKING ORDER'],['BMT','BASIC MILITARY TRAINING'],
  ['BNR','BY NAME REQUEST'],['BTZ','BELOW-THE-ZONE'],['C2','COMMAND AND CONTROL'],
  ['C4ISR','COMMAND, CONTROL, COMMUNICATIONS, COMPUTERS, INTELLIGENCE, SURVEILLANCE AND RECONNAISSANCE'],
  ['CAOC','COMBINED AIR OPERATIONS CENTER'],['CAS','CLOSE AIR SUPPORT'],['CAT','CRISIS ACTION TEAM'],
  ['CATM','COMBAT ARMS TRAINING AND MAINTENANCE'],['CBRN','CHEMICAL, BIOLOGICAL, RADIOLOGICAL, NUCLEAR'],
  ['CBT','COMPUTER BASED TRAINING'],['CCAF','COMMUNITY COLLEGE OF THE AIR FORCE'],
  ['CCIP',"COMMANDER'S INSPECTION PROGRAM"],['CDI','COMMANDER DIRECTED INVESTIGATION'],
  ['CFETP','CAREER FIELD EDUCATION AND TRAINING PLAN'],['CFM','CAREER FIELD MANAGER'],
  ['CLA','CHIEF MASTER SERGEANT LEADERSHIP ACADEMY'],['CLC','CHIEF MASTER SERGEANT LEADERSHIP COURSE'],
  ['COA','COURSE OF ACTION'],['CODEL','CONGRESSIONAL DELEGATION'],['CONOPS','CONCEPT OF OPERATIONS'],
  ['CONUS','CONTINENTAL UNITED STATES'],['COOP','CONTINUITY OF OPERATIONS'],
  ['CPI','CONTINUOUS PROCESS IMPROVEMENT'],['CPR','CARDIOPULMONARY RESUSCITATION'],
  ['CSAR','COMBAT SEARCH AND RESCUE'],['CUI','CONTROLLED UNCLASSIFIED INFORMATION'],
  ['DAFI','DEPARTMENT OF THE AIR FORCE INSTRUCTION'],['DAFMAN','DEPARTMENT OF THE AIR FORCE MANUAL'],
  ['DEOCS','DEFENSE EQUAL OPPORTUNITY CLIMATE SURVEY'],['DG','DISTINGUISHED GRADUATE'],
  ['DHA','DEFENSE HEALTH AGENCY'],['DSG','DRILL STATUS GUARDSMAN'],['DV','DISTINGUISHED VISITOR'],
  ['EKIA','ENEMY KILLED IN ACTION'],['EOC','EMERGENCY OPERATIONS CENTER'],
  ['EOD','EXPLOSIVE ORDNANCE DISPOSAL'],['EOY','END OF YEAR'],['EPB','ENLISTED PERFORMANCE BRIEF'],
  ['EW','ELECTRONIC WARFARE'],['FAM','FUNCTIONAL AREA MANAGER'],['FHP','FLYING HOUR PROGRAM'],
  ['FMC','FULLY MISSION CAPABLE'],['FOB','FORWARD OPERATING BASE'],['FOC','FULL OPERATIONAL CAPABILITY'],
  ['FOL','FORWARD OPERATING LOCATION'],['FPCON','FORCE PROTECTION CONDITIONS'],
  ['FTEC','FIRST TERM ENLISTED COURSE'],['FTU','FORMAL TRAINING UNIT'],['GPA','GRADE POINT AVERAGE'],
  ['GPS','GLOBAL POSITIONING SYSTEM'],['GSU','GEOGRAPHICALLY SEPARATED UNIT'],
  ['GTC','GOVERNMENT TRAVEL CARD'],['IDT','INACTIVE DUTY TRAINING'],
  ['IDE','INTERMEDIATE DEVELOPMENTAL EDUCATION'],['IED','IMPROVISED EXPLOSIVE DEVICE'],
  ['IMA','INDIVIDUAL MOBILIZATION AUGMENTEE'],['IOC','INITIAL OPERATIONAL CAPABILITY'],
  ['IP','INSTRUCTOR PILOT'],['ISR','INTELLIGENCE, SURVEILLANCE, AND RECONNAISSANCE'],
  ['IT','INFORMATION TECHNOLOGY'],['JADC2','JOINT ALL DOMAIN COMMAND AND CONTROL'],
  ['JROTC','JUNIOR RESERVE OFFICER TRAINING CORPS'],['KIA','KILLED IN ACTION'],['LOE','LINE OF EFFORT'],
  ['MCA','MULTI-CAPABLE AIRMEN'],['MDS','MISSION DESIGN SERIES'],['MILCON','MILITARY CONSTRUCTION'],
  ['MILPDS','MILITARY PERSONNEL DATA SYSTEM'],['MOA','MEMORANDUM OF AGREEMENT'],
  ['MOU','MEMORANDUM OF UNDERSTANDING'],['MTF','MEDICAL TREATMENT FACILITY'],
  ['MWR','MORALE, WELFARE, AND RECREATION'],['MX','MAINTENANCE'],
  ['NC3','NUCLEAR COMMAND, CONTROL, AND COMMUNICATIONS'],['NCOA','NONCOMMISSIONED OFFICER ACADEMY'],
  ['NCR','NATIONAL CAPITAL REGION'],['NDAA','NATIONAL DEFENSE AUTHORIZATION ACT'],
  ['NDS','NATIONAL DEFENSE STRATEGY'],['NEO','NONCOMBATANT EVACUATION OPERATION'],
  ['NIPR','NON-SECURE INTERNET PROTOCOL ROUTER'],['NMC','NON MISSION CAPABLE'],
  ['O&M','OPERATIONS AND MAINTENANCE'],['OCO','OVERSEAS CONTINGENCY OPERATIONS'],
  ['OCONUS','OUTSIDE CONTINENTAL UNITED STATES'],['OJT','ON THE JOB TRAINING'],
  ['OPLAN','OPERATIONS PLAN'],['OPSEC','OPERATIONAL SECURITY'],['OTS','OFFICER TRAINING SCHOOL'],
  ['PCS','PERMANENT CHANGE OF STATION'],['PDE','PRIMARY DEVELOPMENTAL EDUCATION'],
  ['PFA','PHYSICAL FITNESS ASSESSMENT'],['PME','PROFESSIONAL MILITARY EDUCATION'],
  ['POC','POINT OF CONTACT'],['PT','PHYSICAL TRAINING'],['QA','QUALITY ASSURANCE'],
  ['QoL','QUALITY OF LIFE'],['ROE','RULES OF ENGAGEMENT'],['ROTC','RESERVE OFFICER TRAINING CORPS'],
  ['RPA','REMOTELY PILOTED AIRCRAFT'],['SAPR','SEXUAL ASSAULT PREVENTION AND RESPONSE'],
  ['SCIF','SENSITIVE COMPARTMENTED INFORMATION FACILITY'],['SDE','SENIOR DEVELOPMENTAL EDUCATION'],
  ['SERE','SURVIVAL, EVASION, RESISTANCE, ESCAPE'],['SIPR','SECRET INTERNET PROTOCOL ROUTER'],
  ['SME','SUBJECT MATTER EXPERT'],['SNCOA','SENIOR NONCOMMISSIONED OFFICER ACADEMY'],
  ['SOF','SPECIAL OPERATIONS FORCES'],['SOP','STANDARD OPERATING PROCEDURE'],
  ['SOS','SQUADRON OFFICER SCHOOL'],['STEM','SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS'],
  ['TACP','TACTICAL AIR CONTROL PARTY'],['TCCC','TACTICAL COMBAT CASUALTY CARE'],
  ['TDY','TEMPORARY DUTY'],['TFI','TOTAL FORCE INTEGRATION'],['TR','TRADITIONAL RESERVIST'],
  ['TS','TOP SECRET'],['TTP','TACTICS, TECHNIQUES, AND PROCEDURES'],['UCI','UNIT COMPLIANCE INSPECTION'],
  ['UCMJ','UNIFORM CODE OF MILITARY JUSTICE'],['UEI','UNIT EFFECTIVENESS INSPECTION'],
  ['UTA','UNIT TRAINING ASSEMBLY'],['UTC','UNIT TYPE CODE'],['UXO','UNEXPLODED ORDNANCE'],
  ['WRM','WAR RESERVE MATERIEL'],['XAB','EXPEDITIONARY AIRBASE']
];

let rules=loadRules();
let currentOutput='';

function syncPaperScale(){
  document.querySelectorAll('.paper-shell').forEach(shell=>{
    const paper=shell.querySelector('.paper');
    const scale=Math.min(1,Math.max(.1,shell.clientWidth/PAPER_WIDTH_PX));
    paper.style.setProperty('--paper-scale',scale);
    shell.style.height=`${Math.ceil(PAPER_HEIGHT_PX*scale)}px`;
  });
}

function cleanText(value){return value.replace(/[ \t]+/g,' ').replace(/\s*\n\s*/g,'\n').trim()}
function escapeRegex(value){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function applyRules(value){
  let output=cleanText(value);
  [...rules].sort((a,b)=>b.from.length-a.from.length).forEach(rule=>{
    const pattern=new RegExp(`(^|[^A-Za-z0-9])(${escapeRegex(rule.from)})(?=$|[^A-Za-z0-9])`,'gi');
    output=output.replace(pattern,(_,before)=>before+rule.to);
  });
  return output;
}

const widthCanvas=document.createElement('canvas');
const widthContext=widthCanvas.getContext('2d');
widthContext.font='12pt "Times New Roman"';
function lineWidth(text){return widthContext.measureText(text).width}
function spacingOrder(text){
  const chars=[...text],eligible=[];
  for(let i=0;i<chars.length;i++){
    if(chars[i]!==' ')continue;
    if(i===1&&'–—-'.includes(chars[0]))continue;
    eligible.push(i);
  }
  if(eligible.length<3)return eligible;
  const ordered=[],used=new Set(),step=Math.max(1,Math.floor(eligible.length*.618));
  let cursor=Math.floor(eligible.length/2);
  while(ordered.length<eligible.length){
    while(used.has(cursor))cursor=(cursor+1)%eligible.length;
    used.add(cursor);ordered.push(eligible[cursor]);cursor=(cursor+step)%eligible.length;
  }
  return ordered;
}

function spaceVersion(text,order,count,space){const chars=[...text];for(let i=0;i<count;i++)chars[order[i]]=space;return chars.join('')}
function optimizeLine(text){
  const order=spacingOrder(text),width=lineWidth(text);
  if(width>FIELD_WIDTH_PX){
    const compressed=spaceVersion(text,order,order.length,NARROW_SPACE);
    if(lineWidth(compressed)>FIELD_WIDTH_PX)return {text:compressed,fits:false,narrow:order.length,wide:0};
    let low=1,high=order.length;
    while(low<high){const mid=Math.floor((low+high)/2);if(lineWidth(spaceVersion(text,order,mid,NARROW_SPACE))<=FIELD_WIDTH_PX)high=mid;else low=mid+1}
    return {text:spaceVersion(text,order,low,NARROW_SPACE),fits:true,narrow:low,wide:0};
  }
  if(!order.length)return {text,fits:true,narrow:0,wide:0};
  const expanded=spaceVersion(text,order,order.length,WIDE_SPACE);
  if(lineWidth(expanded)<=FIELD_WIDTH_PX)return {text:expanded,fits:true,narrow:0,wide:order.length};
  let low=0,high=order.length;
  while(low<high){const mid=Math.ceil((low+high)/2);if(lineWidth(spaceVersion(text,order,mid,WIDE_SPACE))<=FIELD_WIDTH_PX)low=mid;else high=mid-1}
  return {text:spaceVersion(text,order,low,WIDE_SPACE),fits:true,narrow:0,wide:low};
}
function optimizeSpaces(text){
  const rows=text?text.split('\n'):[],optimized=rows.map(optimizeLine),fits=rows.length<=LINE_LIMIT&&optimized.every(row=>row.fits);
  return {text:optimized.map(row=>row.text).join('\n'),result:{lines:rows.length,fits},narrow:optimized.reduce((sum,row)=>sum+row.narrow,0),wide:optimized.reduce((sum,row)=>sum+row.wide,0)};
}

function render(){
  const optimized=optimizeSpaces(applyRules(els.source.value));
  currentOutput=optimized.text;
  const result=optimized.result;
  els.preview.textContent=currentOutput;
  els.box.style.backgroundSize=`100% ${100/LINE_LIMIT}%`;
  els.count.textContent=`${cleanText(els.source.value).length} characters`;
  els.estimate.textContent=`${result.lines} bullet line${result.lines===1?'':'s'}`;
  els.box.classList.toggle('over',!result.fits);
  els.hint.textContent=result.fits
    ?`Fits ${FORM_WIDTH_MM} mm · ${optimized.narrow} U+2006 narrowed · ${optimized.wide} U+2004 widened.`
    :`Red output means at least one line still exceeds ${FORM_WIDTH_MM} mm after every safe space was changed to U+2006.`;
}

function loadRules(){
  try{
    const saved=JSON.parse(localStorage.getItem(RULES_KEY));
    if(Array.isArray(saved))return saved.filter(rule=>rule.from&&rule.to);
  }catch{}
  return DEFAULT_RULES.map(rule=>({...rule}));
}
function saveRules(){localStorage.setItem(RULES_KEY,JSON.stringify(rules))}
function renderRules(){
  els.ruleList.replaceChildren();
  if(!rules.length){
    const empty=document.createElement('div');
    empty.className='rule-empty';
    empty.textContent='No automatic replacements yet.';
    els.ruleList.append(empty);
    return;
  }
  rules.forEach((rule,index)=>{
    const chip=document.createElement('div');
    chip.className='rule-chip';
    const text=document.createElement('span');
    text.textContent=`${rule.from} → `;
    const replacement=document.createElement('b');
    replacement.textContent=rule.to;
    const remove=document.createElement('button');
    remove.type='button';
    remove.setAttribute('aria-label',`Remove ${rule.from} replacement`);
    remove.textContent='×';
    remove.addEventListener('click',()=>confirmAction(remove,'✓',()=>{rules.splice(index,1);saveRules();renderRules();render();notify('Replacement removed')}));
    chip.append(text,replacement,remove);
    els.ruleList.append(chip);
  });
}
function addRule(from,to){
  const phrase=from.trim(),replacement=to.trim();
  if(!phrase||!replacement){notify('Enter both a phrase and replacement');return false}
  const existing=rules.find(rule=>rule.from.toLowerCase()===phrase.toLowerCase());
  if(existing)existing.to=replacement;else rules.push({from:phrase,to:replacement});
  saveRules();renderRules();render();return true;
}

function renderAcronyms(query=''){
  const term=query.trim().toLowerCase();
  const matches=ACRONYMS.filter(([short,definition])=>!term||short.toLowerCase().includes(term)||definition.toLowerCase().includes(term));
  els.results.replaceChildren();
  matches.forEach(([short,definition])=>{
    const row=document.createElement('tr');
    const acronym=document.createElement('td');acronym.textContent=short;
    const meaning=document.createElement('td');meaning.textContent=definition;
    const action=document.createElement('td');
    const use=document.createElement('button');use.type='button';use.className='use-acronym';use.textContent='Use';
    use.setAttribute('aria-label',`Replace ${definition} with ${short}`);
    use.addEventListener('click',()=>{addRule(definition,short);notify(`${short} rule added`)});
    action.append(use);row.append(acronym,meaning,action);els.results.append(row);
  });
  if(!matches.length){
    const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=3;cell.className='no-results';cell.textContent='No approved acronyms match that search.';
    row.append(cell);els.results.append(row);
  }
  els.resultsMeta.textContent=`AFPC update: 28 Oct 2024 · ${matches.length} of ${ACRONYMS.length} approved entries`;
}

// A collapsible reference drawer stays available in both work areas.
const drawer=$('#utilityDrawer');
function setDrawer(open){drawer.classList.toggle('collapsed',!open);document.body.classList.toggle('drawer-open',open);$('#drawerToggle').setAttribute('aria-expanded',String(open));$('#drawerBody').inert=!open;requestAnimationFrame(syncPaperScale)}
$('#drawerToggle').addEventListener('click',()=>setDrawer(drawer.classList.contains('collapsed')));
$('#drawerClose').addEventListener('click',()=>setDrawer(false));
const drawerTabs=[...document.querySelectorAll('.drawer-tab')];
drawerTabs.forEach(tab=>tab.addEventListener('click',()=>{
  drawerTabs.forEach(item=>{const selected=item===tab;item.classList.toggle('active',selected);item.setAttribute('aria-selected',String(selected));document.getElementById(item.getAttribute('aria-controls')).hidden=!selected});
}));
setDrawer(false);

const APPEARANCE_KEY='bullet-shitter-appearance-v1';
let appearance={theme:'light',nightHue:0};
try{const stored=JSON.parse(localStorage.getItem(APPEARANCE_KEY)||'{}');if(stored.theme==='dark'||stored.theme==='light')appearance.theme=stored.theme;const level=Number(stored.nightHue);if(Number.isFinite(level))appearance.nightHue=Math.min(100,Math.max(0,level))}catch{}
function applyAppearance(){
  document.body.dataset.theme=appearance.theme;
  const warmth=appearance.nightHue/100;
  document.documentElement.style.filter=warmth?`sepia(${Math.round(warmth*72)}%) saturate(${Math.round(100+warmth*62)}%) hue-rotate(${Math.round(warmth*-18)}deg) brightness(${Math.round(100-warmth*22)}%)`:'none';
  const selected=document.querySelector(`input[name="siteTheme"][value="${appearance.theme}"]`);if(selected)selected.checked=true;
  $('#nightHue').value=String(appearance.nightHue);$('#nightHueOutput').textContent=`${appearance.nightHue}%`;
  try{localStorage.setItem(APPEARANCE_KEY,JSON.stringify(appearance))}catch{}
}
document.querySelectorAll('input[name="siteTheme"]').forEach(input=>input.addEventListener('change',()=>{if(input.checked){appearance.theme=input.value;applyAppearance()}}));
$('#nightHue').addEventListener('input',event=>{appearance.nightHue=Number(event.target.value);applyAppearance()});
$('#resetSettings').addEventListener('click',()=>confirmAction($('#resetSettings'),'Confirm reset',()=>{appearance={theme:'light',nightHue:0};applyAppearance();notify('Appearance reset')}));
applyAppearance();

const WORD_BANK={
  achieved:['reached a desired result successfully',['accomplished','attained','delivered','secured']],
  accelerated:['made a process happen sooner or move faster',['advanced','expedited','quickened','streamlined']],
  accomplished:['completed something successfully',['achieved','completed','delivered','executed']],
  advanced:['moved a mission, program, or capability forward',['accelerated','improved','progressed','strengthened']],
  built:['created or developed something useful',['created','developed','established','formed']],
  championed:['actively supported and drove an effort',['advocated','led','promoted','spearheaded']],
  coordinated:['organized people or activities to work together effectively',['aligned','integrated','organized','synchronized']],
  created:['brought something new into existence',['built','designed','developed','established']],
  delivered:['produced or provided a promised result',['achieved','completed','executed','provided']],
  designed:['planned the form, function, or structure of something',['created','developed','engineered','planned']],
  developed:['grew or created a capability over time',['built','created','cultivated','strengthened']],
  directed:['controlled or guided an operation or team',['guided','led','managed','oversaw']],
  eliminated:['completely removed a problem, delay, or waste',['eradicated','removed','resolved','stopped']],
  enabled:['made an action or result possible',['empowered','facilitated','supported','unlocked']],
  engineered:['designed or built a technical solution',['built','created','designed','developed']],
  established:['created something intended to last',['built','created','founded','instituted']],
  executed:['carried out a plan or task effectively',['accomplished','completed','delivered','performed']],
  expanded:['increased the size, scope, or reach of something',['broadened','extended','grew','scaled']],
  expedited:['made a process finish faster',['accelerated','quickened','streamlined','shortened']],
  generated:['produced a measurable output or result',['created','delivered','produced','yielded']],
  improved:['made something better in quality or performance',['advanced','enhanced','optimized','strengthened']],
  increased:['made an amount, rate, or capability larger',['boosted','expanded','grew','raised']],
  integrated:['combined parts into a coordinated whole',['aligned','combined','coordinated','unified']],
  led:['guided people or an effort toward a result',['championed','directed','guided','spearheaded']],
  managed:['controlled resources, work, or people responsibly',['administered','directed','oversaw','supervised']],
  modernized:['updated something using current methods or technology',['improved','refreshed','transformed','upgraded']],
  optimized:['made something as effective or efficient as practical',['enhanced','improved','refined','streamlined']],
  orchestrated:['coordinated a complex effort with many moving parts',['coordinated','directed','organized','synchronized']],
  pioneered:['introduced or developed something first',['created','innovated','launched','spearheaded']],
  prevented:['stopped a harmful event or condition from occurring',['averted','blocked','protected','stopped']],
  produced:['created a concrete output or measurable result',['created','delivered','generated','yielded']],
  reduced:['made an amount, cost, delay, or risk smaller',['cut','decreased','lowered','minimized']],
  resolved:['found and applied a solution to a problem',['corrected','eliminated','fixed','remedied']],
  restored:['returned a capability or condition to working order',['recovered','reestablished','repaired','revived']],
  secured:['obtained or protected something important',['achieved','acquired','protected','won']],
  spearheaded:['took the lead in starting and driving an effort',['championed','launched','led','pioneered']],
  streamlined:['removed unnecessary steps to improve speed or efficiency',['accelerated','optimized','simplified','tightened']],
  strengthened:['made a capability, team, or result more effective',['advanced','enhanced','improved','reinforced']],
  transformed:['changed something substantially for the better',['modernized','overhauled','restructured','revolutionized']],
  upgraded:['raised something to a newer or better standard',['enhanced','improved','modernized','strengthened']]
};
$('#thesaurusForm').addEventListener('submit',event=>{
  event.preventDefault();
  const term=$('#thesaurusSearch').value.trim();
  if(!term)return;
  window.open(`https://www.thesaurus.com/browse/${encodeURIComponent(term)}`,'_blank','noopener,noreferrer');
});

const confirmationTimers=new WeakMap();
function resetConfirmation(button){const timer=confirmationTimers.get(button);if(timer)clearTimeout(timer);confirmationTimers.delete(button);button.textContent=button.dataset.defaultLabel||button.textContent;button.classList.remove('confirming-action');delete button.dataset.confirming}
function confirmAction(button,prompt,action){
  if(button.dataset.confirming==='true'){resetConfirmation(button);action();return}
  button.dataset.defaultLabel=button.textContent;button.dataset.confirming='true';button.textContent=prompt;button.classList.add('confirming-action');
  confirmationTimers.set(button,setTimeout(()=>resetConfirmation(button),6000));
}
function notify(message){els.toast.textContent=message;els.toast.classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>els.toast.classList.remove('show'),1800)}

// Email/password accounts are handled by Supabase Auth once the owner supplies
// this site's public project URL and anon key in auth-config.js.
const AUTH_SESSION_KEY='bullet-shitter-auth-session-v1';
const authConfig=globalThis.BULLET_SHITTER_AUTH||{};
const accountDialog=$('#accountDialog');
let authSession=null;
try{authSession=JSON.parse(localStorage.getItem(AUTH_SESSION_KEY)||'null')}catch{}
function authReady(){return /^https:\/\//.test(authConfig.supabaseUrl||'')&&Boolean(authConfig.anonKey)}
async function authRequest(path,{method='POST',body,token}={}){
  if(!authReady())throw new Error('Account registration needs to be connected by the site owner.');
  const response=await fetch(`${authConfig.supabaseUrl.replace(/\/$/,'')}/auth/v1/${path}`,{method,headers:{apikey:authConfig.anonKey,Authorization:`Bearer ${token||authConfig.anonKey}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.msg||data.message||data.error_description||'Account request failed.');
  return data;
}
async function dataRequest(table,{method='GET',query='select=*',body,prefer}={}){
  if(!authSession?.access_token)throw new Error('Sign in to use account storage.');
  const response=await fetch(`${authConfig.supabaseUrl.replace(/\/$/,'')}/rest/v1/${table}${query?`?${query}`:''}`,{method,headers:{apikey:authConfig.anonKey,Authorization:`Bearer ${authSession.access_token}`,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const data=response.status===204?null:await response.json().catch(()=>null);
  if(!response.ok)throw new Error(data?.message||data?.hint||'Account storage is unavailable.');
  return data;
}
function sessionUser(){return authSession?.user||null}
function displayNameFor(user){return user?.user_metadata?.display_name||user?.email?.split('@')[0]||'Profile'}
function renderAccount(){
  const user=sessionUser(),signedIn=Boolean(user);
  $('#profileName').textContent=signedIn?displayNameFor(user):'Sign in';
  $('#profileEmail').textContent=signedIn?user.email:'Save work to your account';
  $('#profileAvatar').textContent=signedIn?displayNameFor(user).slice(0,1).toUpperCase():'?';
  $('#accountAuthForm').hidden=signedIn;$('#profileForm').hidden=!signedIn;
  $('#accountDialogTitle').textContent=signedIn?'Your profile':'Sign in or create an account';
  if(signedIn){$('#profileDisplayName').value=displayNameFor(user);$('#profileEmailInput').value=user.email||'';$('#accountStatus').textContent='Signed in. Your saved work syncs with this account.'}
  else $('#accountStatus').textContent=authReady()?'Use any valid email address. Email verification may be required.':'Account registration is prepared but not connected yet.';
}
function saveAuthSession(session){authSession=session||null;try{session?localStorage.setItem(AUTH_SESSION_KEY,JSON.stringify(session)):localStorage.removeItem(AUTH_SESSION_KEY)}catch{}renderAccount()}
$('#profileTrigger').addEventListener('click',()=>{renderAccount();accountDialog.showModal()});
$('#accountClose').addEventListener('click',()=>accountDialog.close());
accountDialog.addEventListener('click',event=>{if(event.target===accountDialog)accountDialog.close()});
$('#accountAuthForm').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('#accountSignIn');button.disabled=true;
  try{const data=await authRequest('token?grant_type=password',{body:{email:$('#accountEmail').value.trim(),password:$('#accountPassword').value}});saveAuthSession(data);await initializeAccountStorage();notify('Signed in')}
  catch(error){$('#accountStatus').textContent=error.message}finally{button.disabled=false}
});
$('#accountSignUp').addEventListener('click',async()=>{
  const email=$('#accountEmail').value.trim(),password=$('#accountPassword').value,display_name=$('#accountDisplayName').value.trim();
  if(!email||password.length<8){$('#accountStatus').textContent='Enter a valid email and a password with at least 8 characters.';return}
  const button=$('#accountSignUp');button.disabled=true;
  try{const data=await authRequest(`signup?redirect_to=${encodeURIComponent(location.origin+location.pathname)}`,{body:{email,password,data:{display_name}}});if(data.access_token){saveAuthSession(data);await initializeAccountStorage()}$('#accountStatus').textContent=data.access_token?'Account created and signed in.':'Check your email to verify the account, then sign in.'}
  catch(error){$('#accountStatus').textContent=error.message}finally{button.disabled=false}
});
$('#accountRecovery').addEventListener('click',async()=>{
  const email=$('#accountEmail').value.trim();if(!email){$('#accountStatus').textContent='Enter your email address first.';return}
  try{await authRequest(`recover?redirect_to=${encodeURIComponent(location.origin+location.pathname)}`,{body:{email}});$('#accountStatus').textContent='If that account exists, a password-reset email is on the way.'}catch(error){$('#accountStatus').textContent=error.message}
});
$('#profileForm').addEventListener('submit',async event=>{
  event.preventDefault();if(!authSession?.access_token)return;
  try{const password=$('#profileNewPassword').value;const changes={data:{display_name:$('#profileDisplayName').value.trim()}};if(password){if(password.length<8)throw new Error('The new password must be at least 8 characters.');changes.password=password}const user=await authRequest('user',{method:'PUT',token:authSession.access_token,body:changes});authSession.user=user;saveAuthSession(authSession);$('#profileNewPassword').value='';await dataRequest('profiles',{method:'POST',query:'on_conflict=user_id',body:{user_id:user.id,display_name:displayNameFor(user),updated_at:new Date().toISOString()},prefer:'resolution=merge-duplicates'});notify('Profile updated')}
  catch(error){$('#accountStatus').textContent=error.message}
});
$('#accountSignOut').addEventListener('click',async()=>{try{if(authSession?.access_token)await authRequest('logout',{token:authSession.access_token})}catch{}saveAuthSession(null);reloadLocalLibraries();notify('Signed out')});
renderAccount();

let bulletHistory=[els.source.value],bulletHistoryIndex=0,historyApplying=false;
function updateHistoryButtons(){$('#undoButton').disabled=bulletHistoryIndex<=0;$('#redoButton').disabled=bulletHistoryIndex>=bulletHistory.length-1}
function resetBulletHistory(){bulletHistory=[els.source.value];bulletHistoryIndex=0;updateHistoryButtons()}
function applyBulletHistory(index){if(index<0||index>=bulletHistory.length)return;historyApplying=true;bulletHistoryIndex=index;els.source.value=bulletHistory[index];render();historyApplying=false;updateHistoryButtons();els.source.focus()}
els.source.addEventListener('input',()=>{render();if(historyApplying)return;bulletHistory=bulletHistory.slice(0,bulletHistoryIndex+1);bulletHistory.push(els.source.value);if(bulletHistory.length>250)bulletHistory.shift();else bulletHistoryIndex++;updateHistoryButtons()});
$('#undoButton').addEventListener('click',()=>applyBulletHistory(bulletHistoryIndex-1));
$('#redoButton').addEventListener('click',()=>applyBulletHistory(bulletHistoryIndex+1));
els.phrase.addEventListener('input',()=>{const suggestion=SUGGESTIONS[els.phrase.value.trim().toLowerCase()];if(suggestion&&!els.replacement.value)els.replacement.value=suggestion});
$('#abbreviationForm').addEventListener('submit',event=>{event.preventDefault();if(addRule(els.phrase.value,els.replacement.value)){els.phrase.value='';els.replacement.value='';els.phrase.focus();notify('Replacement added')}});
$('#resetRules').addEventListener('click',()=>confirmAction($('#resetRules'),'Confirm reset',()=>{rules=DEFAULT_RULES.map(rule=>({...rule}));saveRules();renderRules();render();notify('Default replacements restored')}));
$('#copyButton').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(currentOutput);notify('Formatted text copied')}catch{notify('Select and copy the text manually')}});
els.search.addEventListener('input',()=>renderAcronyms(els.search.value));
const boxObserver=new ResizeObserver(syncPaperScale);
document.querySelectorAll('.paper-shell').forEach(shell=>boxObserver.observe(shell));
syncPaperScale();
renderRules();
renderAcronyms();
render();

// Versioned snapshots retain the source, generated text, and abbreviation rules.
const BULLETS_KEY='tighttype-saved-bullets-v1';
const LEGACY_CLAIM_KEY='bullet-shitter-legacy-library-claimed-v1';
function bulletStorageKey(){return authSession?.user?.id?`${BULLETS_KEY}:${authSession.user.id}`:BULLETS_KEY}
let savedBullets=[];
let currentBulletId=null;
try{
  const stored=JSON.parse(localStorage.getItem(bulletStorageKey())||'[]');
  if(!Array.isArray(stored))throw new Error('Invalid saved data');
  savedBullets=stored.filter(row=>row&&typeof row==='object').map(row=>({...row,id:row.id||makeId(),title:String(row.title||'Untitled bullet'),source:String(row.source||''),output:String(row.output||row.source||''),rules:Array.isArray(row.rules)?row.rules.filter(rule=>rule&&typeof rule.from==='string'&&typeof rule.to==='string'):DEFAULT_RULES.map(rule=>({...rule}))}));
}catch{
  $('#savedStatus').textContent='Saved bullets could not be loaded. Browser storage may be unavailable.';
}
function storeBullets(next){
  try{localStorage.setItem(bulletStorageKey(),JSON.stringify(next));savedBullets=next;return true}
  catch{notify('Could not save changes. Browser storage may be full or unavailable.');return false}
}
function showSavedBullets(){
  const list=$('#savedBullets');list.replaceChildren();
  if(!savedBullets.length){const empty=document.createElement('p');empty.textContent='Your titled bullets will appear here.';empty.className='section-help';list.append(empty);return}
  savedBullets.forEach(bullet=>{
    const item=document.createElement('article');item.className='saved-item';
    const title=document.createElement('h3');title.textContent=bullet.title;
    const date=document.createElement('time');date.dateTime=bullet.createdAt;date.textContent=new Date(bullet.createdAt).toLocaleString();
    const text=document.createElement('p');text.textContent=bullet.output;
    const actions=document.createElement('div');actions.className='saved-actions';
    const open=document.createElement('button');open.type='button';open.className='secondary';open.textContent='Edit';
    open.addEventListener('click',()=>{
      els.source.value=bullet.source;$('#bulletTitle').value=bullet.title;
      rules=bullet.rules.map(rule=>({...rule}));renderRules();render();
      currentBulletId=bullet.id;$('#saveBulletButton').textContent='Save changes';
      resetBulletHistory();selectTab($('#tab-1206'));$('#sourceText').focus();notify('Saved bullet ready to edit');
    });
    const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Delete';remove.setAttribute('aria-label',`Delete ${bullet.title}`);
    remove.addEventListener('click',()=>confirmAction(remove,'Confirm delete',()=>{if(storeBullets(savedBullets.filter(row=>row.id!==bullet.id))){void deleteCloudRecord('bullets',bullet.id);showSavedBullets();notify('Saved bullet deleted')}}));
    actions.append(open,remove);item.append(title,date,text,actions);list.append(item);
  });
}
function saveBullet(asCopy=false){
  const title=$('#bulletTitle').value.trim();
  if(!title){notify('Give the bullet a title.');return}
  if(!els.source.value.trim()){notify('Write a bullet before saving.');return}
  render();
  const existing=!asCopy&&currentBulletId?savedBullets.find(row=>row.id===currentBulletId):null;
  const bullet={schemaVersion:1,id:existing?.id||makeId(),title,source:els.source.value,output:currentOutput,rules:rules.map(rule=>({...rule})),createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  const next=existing?savedBullets.map(row=>row.id===existing.id?bullet:row):[bullet,...savedBullets];
  if(storeBullets(next)){currentBulletId=bullet.id;$('#saveBulletButton').textContent='Save changes';showSavedBullets();void upsertCloudBullet(bullet);notify(existing?'Changes saved':'Bullet saved')}
}
$('#saveBulletForm').addEventListener('submit',event=>{event.preventDefault();saveBullet(false)});
$('#saveBulletCopyButton').addEventListener('click',()=>saveBullet(true));
let clearConfirmStep=0,clearConfirmTimer;
function resetClearConfirm(){clearConfirmStep=0;clearTimeout(clearConfirmTimer);const button=$('#clearContentsButton');button.textContent='Clear Contents';button.classList.remove('confirming','really-confirming')}
$('#clearContentsButton').addEventListener('click',()=>{
  const button=$('#clearContentsButton');clearTimeout(clearConfirmTimer);
  if(clearConfirmStep===0){clearConfirmStep=1;button.textContent='are you sure?';button.classList.add('confirming');clearConfirmTimer=setTimeout(resetClearConfirm,6000);return}
  if(clearConfirmStep===1){clearConfirmStep=2;button.textContent='ARE YOU REALLY SURE?';button.classList.add('really-confirming');clearConfirmTimer=setTimeout(resetClearConfirm,6000);return}
  currentBulletId=null;$('#bulletTitle').value='';$('#saveBulletButton').textContent='Save bullet';els.source.value='';render();resetBulletHistory();resetClearConfirm();els.source.focus();notify('Contents cleared');
});
updateHistoryButtons();
showSavedBullets();

// EPB / OPB builder, local saves, preview, and flattened official-form PDF export.
const REPORTS_KEY='tighttype-saved-reports-v1';
function reportStorageKey(){return authSession?.user?.id?`${REPORTS_KEY}:${authSession.user.id}`:REPORTS_KEY}
const enlistedGrades=['','CMSgt','CMSgt Select','SMSgt','SMSgt Select','MSgt','MSgt Select','TSgt','TSgt Select','SSgt','SSgt Select','SrA','A1C','Amn','AB'];
const officerGrades=['','Col','Col (S)','Col (T)','Lt Col','Lt Col (S)','Lt Col (T)','Maj','Maj (S)','Maj (T)','Capt','Capt (S)','Capt (T)','1Lt','2Lt','CW5','CW5 (S)','CW4','CW4 (S)','CW3','CW3 (S)','CW2','WO1'];
const reasons={EPB:['','Dir by HQ USAF','Dir by Commander','Annual','First Annual','First Biennial','Biennial'],OPB:['','Dir by HQ USAF','Dir by Commander','Annual','Biennial']};
const reportInputs=[...document.querySelectorAll('[data-report]')];
let reportType='EPB';
let savedReports=[];
let currentReportId=null;
try{
  const stored=JSON.parse(localStorage.getItem(reportStorageKey())||'[]');
  if(Array.isArray(stored))savedReports=stored.filter(row=>row&&typeof row==='object').map(row=>({schemaVersion:1,id:row.id||makeId(),title:String(row.title||'Untitled report'),type:row.type==='OPB'?'OPB':'EPB',data:row.data&&typeof row.data==='object'?row.data:{},createdAt:row.createdAt||new Date().toISOString(),updatedAt:row.updatedAt||row.createdAt||new Date().toISOString()}));
}catch{$('#savedReportsStatus').textContent='Saved reports could not be loaded. New reports can still be saved.'}

function reportData(){const data={};reportInputs.forEach(input=>data[input.dataset.report]=input.value);return data}
function setReportData(data={}){const safe=data&&typeof data==='object'?data:{};reportInputs.forEach(input=>input.value=safe[input.dataset.report]||'');updateReportCounts()}
function optionList(select,values,current=''){select.replaceChildren(...values.map(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;return option}));select.value=values.includes(current)?current:''}
function setReportType(next){
  reportType=next;$('#typeEPB').checked=next==='EPB';$('#typeOPB').checked=next==='OPB';
  optionList($('#gradeSelect'),next==='EPB'?enlistedGrades:officerGrades,$('#gradeSelect').value);
  optionList($('#reasonSelect'),reasons[next],$('#reasonSelect').value);
  $('#epbRecommendationSection').hidden=next!=='EPB';
  $('#opbStratificationSection').hidden=next!=='OPB';
  $('#mandatoryCommentsLabel').childNodes[0].nodeValue=next==='OPB'?'MANDATORY COMMENTS (FITNESS/CLIMATE/HOUSING/VOTING)':'MANDATORY COMMENTS (FITNESS/HOUSING/VOTING)';
  const nbr=next==='EPB'?'716':'715';$('#exportReportButton').textContent=`Export official AF Form ${nbr}`;
}
$('#typeEPB').addEventListener('change',event=>{if(!event.target.checked)event.target.checked=true;setReportType('EPB')});
$('#typeOPB').addEventListener('change',event=>{if(!event.target.checked)event.target.checked=true;setReportType('OPB')});
function updateReportCounts(){document.querySelectorAll('[data-count-for]').forEach(output=>{const input=document.querySelector(`[data-report="${output.dataset.countFor}"]`);const limit=Number(input.maxLength);output.textContent=`${input.value.length} / ${limit}`;output.classList.toggle('near-limit',input.value.length>=limit*.9)})}
reportInputs.forEach(input=>input.addEventListener('input',updateReportCounts));

function storeReports(next){try{localStorage.setItem(reportStorageKey(),JSON.stringify(next));savedReports=next;return true}catch{notify('Could not save report. Browser storage may be unavailable.');return false}}
function showSavedReports(){
  const list=$('#savedReports');list.replaceChildren();
  if(!savedReports.length){const empty=document.createElement('p');empty.className='section-help';empty.textContent='Your titled EPB and OPB reports will appear here.';list.append(empty);return}
  savedReports.forEach(report=>{
    const item=document.createElement('article');item.className='saved-item';const h=document.createElement('h3');h.textContent=report.title;
    const meta=document.createElement('time');meta.dateTime=report.updatedAt||report.createdAt;const parsedDate=new Date(report.updatedAt||report.createdAt);meta.textContent=`${report.type} · ${Number.isNaN(parsedDate.getTime())?'Saved report':parsedDate.toLocaleString()}`;
    const summary=document.createElement('p');summary.textContent=report.data?.name||report.data?.dutyTitle||'Untitled member';
    const actions=document.createElement('div');actions.className='saved-actions';const load=document.createElement('button');load.type='button';load.className='secondary';load.textContent='Edit';
    load.addEventListener('click',()=>{currentReportId=report.id;$('#reportTitle').value=report.title;setReportType(report.type);setReportData(report.data);$('#saveReportButton').textContent='Save changes';selectTab($('#tab-epb'));window.scrollTo({top:0,behavior:'smooth'});notify('Saved report ready to edit')});
    const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Delete';remove.addEventListener('click',()=>confirmAction(remove,'Confirm delete',()=>{if(storeReports(savedReports.filter(row=>row.id!==report.id))){void deleteCloudRecord('reports',report.id);showSavedReports();notify('Saved report deleted')}}));
    actions.append(load,remove);item.append(h,meta,summary,actions);list.append(item);
  });
}
function saveReport(asCopy=false){
  const title=$('#reportTitle').value.trim();if(!title){notify('Give the report a title.');return}
  const existing=!asCopy&&currentReportId?savedReports.find(row=>row.id===currentReportId):null;
  const report={schemaVersion:1,id:existing?.id||makeId(),title,type:reportType,data:reportData(),createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  const next=existing?savedReports.map(row=>row.id===existing.id?report:row):[report,...savedReports];
  if(storeReports(next)){currentReportId=report.id;$('#saveReportButton').textContent='Save changes';void upsertCloudReport(report);try{showSavedReports()}catch{$('#savedReportsStatus').textContent='Report saved. Refresh the page to reload the saved list.'}notify(existing?'Report changes saved':'Report saved')}
}
$('#saveReportForm').addEventListener('submit',event=>{event.preventDefault();saveReport(false)});$('#saveReportCopyButton').addEventListener('click',()=>saveReport(true));
$('#reportForm').addEventListener('submit',event=>event.preventDefault());
function clearReport(){currentReportId=null;$('#reportTitle').value='';$('#saveReportButton').textContent='Save report';setReportData({});notify('New blank form ready')}
$('#newReportButton').addEventListener('click',()=>{if(Object.values(reportData()).some(value=>String(value).trim()))confirmAction($('#newReportButton'),'Are you sure you want to clear your work?',clearReport);else clearReport()});

const XFA_FIELDS={name:'S1Name',dodid:'S1SSN',grade:'Grade',dutyTitle:'dutyTitle',fromDate:'S1FromDate',thruDate:'S1ThruDate',reason:'reasonReport',dafsc:'dafsc',daysSupervised:'daysSupervised',daysNonRated:'daysNonRated',rateeAcknowledgment:'rateeAcknowledgement',organization:'orgComand',location:'orgLocation',dutyDescription:'dutyDescription',executingMission:'executingMission',leadingPeople:'leadingPeople',managingResources:'managingResources',improvingUnit:'improvingUnit',mandatoryComments:'mandatoryComments',mandatoryFitnessComments:'mandatoryFitnessComments',raterName:'raterGradeName',raterDutyTitle:'raterDutyTitle',raterOrganization:'raterOrgComm',raterStratification:'RaterStratification',hlrAssessment:'HLReviewerAssessment',hlrName:'HLRGradeName',hlrDutyTitle:'HLRDutyTitle',hlrOrganization:'HLROrgCommand',hlrStratification:'HLRStratification',promotionRecommendation:'PromoRecomm',higherResponsibility:'HLRHigherResp',futureRole1:'FutureRole1Text',futureRole2:'FutureRole2Text',futureRole3:'FutureRole3Text',stratification:'HLRStratificationBlock'};
function xfaDate(value){return value?value.replaceAll('-',''):''}
function xfaValues(data){const out={};Object.entries(XFA_FIELDS).forEach(([key,field])=>out[field]=key==='fromDate'||key==='thruDate'?xfaDate(data[key]):String(data[key]||''));return out}
function setXfaTemplateValues(xml,values){
  const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw new Error('Official form template could not be read.');
  [...doc.getElementsByTagNameNS('*','field')].forEach(field=>{const value=values[field.getAttribute('name')];if(value===undefined)return;let holder=[...field.children].find(el=>el.localName==='value');if(!holder){holder=doc.createElementNS(field.namespaceURI,'value');const anchor=[...field.children].find(el=>['bind','traversal','event','calculate','validate'].includes(el.localName));field.insertBefore(holder,anchor||null)}let leaf=[...holder.children][0];if(!leaf){leaf=doc.createElementNS(field.namespaceURI,'text');holder.append(leaf)}leaf.textContent=value});
  return new XMLSerializer().serializeToString(doc);
}
function xmlEscape(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]))}
function xfaDatasets(values){
  const node=(name)=>`<${name}>${xmlEscape(values[name]||'')}</${name}>`;
  const intro=['S1Name','S1SSN','dutyTitle','S1FromDate','reasonReport','dafsc','S1ThruDate','daysSupervised','daysNonRated','rateeAcknowledgement','orgComand','orgLocation','executingMission','leadingPeople','managingResources','improvingUnit','Grade','dutyDescription'].map(node).join('');
  const reviewer=['raterGradeName','raterDutyTitle','raterOrgComm','RaterStratification','HLReviewerAssessment','HLRGradeName','HLRDutyTitle','HLROrgCommand','HLRStratification','PromoRecomm','HLRHigherResp','FutureRole1Text','FutureRole2Text','FutureRole3Text','HLRStratificationBlock'].map(node).join('');
  return `<xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/"><xfa:data><form1><Page11><StaticIntro>${intro}</StaticIntro><DynamicMC>${node('mandatoryComments')}</DynamicMC><DynamicMFC>${node('mandatoryFitnessComments')}</DynamicMFC><sub2>${reviewer}</sub2></Page11><Page4>${node('S1Name')}${node('S1SSN')}${node('Grade')}</Page4></form1></xfa:data></xfa:datasets>`;
}
async function exportOfficialForm(){
  const button=$('#exportReportButton'),formNumber=reportType==='EPB'?'716':'715';button.disabled=true;button.textContent='Preparing official form…';
  try{
    if(!globalThis.PDFLib)throw new Error('PDF export library did not load.');
    const [pdfResponse,templateResponse]=await Promise.all([fetch(`./forms/af${formNumber}.pdf`),fetch(`./forms/af${formNumber}-template.xml`)]);if(!pdfResponse.ok||!templateResponse.ok)throw new Error('Official form files are unavailable.');
    const [pdfBytes,templateXml]=await Promise.all([pdfResponse.arrayBuffer(),templateResponse.text()]);
    const pdf=await PDFLib.PDFDocument.load(pdfBytes,{updateMetadata:false});const values=xfaValues(reportData()),encoder=new TextEncoder();
    pdf.context.assign(PDFLib.PDFRef.of(3),pdf.context.flateStream(encoder.encode(setXfaTemplateValues(templateXml,values)),{Type:PDFLib.PDFName.of('EmbeddedFile')}));
    pdf.context.assign(PDFLib.PDFRef.of(86),pdf.context.flateStream(encoder.encode(xfaDatasets(values)),{Type:PDFLib.PDFName.of('EmbeddedFile')}));
    const output=await pdf.save({useObjectStreams:true,addDefaultPage:false,updateFieldAppearances:false});const blob=new Blob([output],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`AF-Form-${formNumber}-${reportType}-${(reportData().name||'report').replace(/[^A-Za-z0-9]+/g,'-')}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify(`Official AF Form ${formNumber} exported`);
  }catch(error){console.error(error);notify('Official form export failed. Please try again.')}finally{button.disabled=false;button.textContent=`Export official AF Form ${formNumber}`}
}
$('#exportReportButton').addEventListener('click',exportOfficialForm);

function cloudBulletRow(bullet){return{id:bullet.id,user_id:sessionUser().id,title:bullet.title,source:bullet.source,output:bullet.output,rules:bullet.rules,created_at:bullet.createdAt,updated_at:bullet.updatedAt}}
function cloudReportRow(report){return{id:report.id,user_id:sessionUser().id,title:report.title,report_type:report.type,report_data:report.data,created_at:report.createdAt,updated_at:report.updatedAt}}
async function upsertCloudBullet(bullet){
  if(!sessionUser())return;
  try{await dataRequest('bullets',{method:'POST',query:'on_conflict=id',body:cloudBulletRow(bullet),prefer:'resolution=merge-duplicates'});$('#savedStatus').textContent='Saved to your account.'}
  catch(error){$('#savedStatus').textContent=`Saved on this device; account sync failed: ${error.message}`}
}
async function upsertCloudReport(report){
  if(!sessionUser())return;
  try{await dataRequest('reports',{method:'POST',query:'on_conflict=id',body:cloudReportRow(report),prefer:'resolution=merge-duplicates'});$('#savedReportsStatus').textContent='Saved to your account.'}
  catch(error){$('#savedReportsStatus').textContent=`Saved on this device; account sync failed: ${error.message}`}
}
async function deleteCloudRecord(table,id){
  if(!sessionUser())return;
  try{await dataRequest(table,{method:'DELETE',query:`id=eq.${encodeURIComponent(id)}`})}catch(error){notify(`Deleted on this device; account sync failed: ${error.message}`)}
}
function parseLocalLibrary(key){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[]}catch{return[]}}
function reloadLocalLibraries(){
  savedBullets=parseLocalLibrary(bulletStorageKey());savedReports=parseLocalLibrary(reportStorageKey());currentBulletId=null;currentReportId=null;
  $('#saveBulletButton').textContent='Save bullet';$('#saveReportButton').textContent='Save report';
  $('#savedStatus').textContent=sessionUser()?'Saved to your account.':'Saved on this browser and device.';
  $('#savedReportsStatus').textContent=sessionUser()?'Saved to your account.':'Saved on this browser and device.';
  showSavedBullets();showSavedReports();
}
async function initializeAccountStorage(){
  const user=sessionUser();if(!user)return;
  $('#savedStatus').textContent='Syncing your account…';$('#savedReportsStatus').textContent='Syncing your account…';
  try{
    await dataRequest('profiles',{method:'POST',query:'on_conflict=user_id',body:{user_id:user.id,display_name:displayNameFor(user),updated_at:new Date().toISOString()},prefer:'resolution=merge-duplicates'});
    const claimed=localStorage.getItem(LEGACY_CLAIM_KEY);
    if(!claimed){
      const legacyBullets=parseLocalLibrary(BULLETS_KEY),legacyReports=parseLocalLibrary(REPORTS_KEY);
      if(legacyBullets.length)await dataRequest('bullets',{method:'POST',query:'on_conflict=id',body:legacyBullets.map(cloudBulletRow),prefer:'resolution=merge-duplicates'});
      if(legacyReports.length)await dataRequest('reports',{method:'POST',query:'on_conflict=id',body:legacyReports.map(cloudReportRow),prefer:'resolution=merge-duplicates'});
      localStorage.setItem(LEGACY_CLAIM_KEY,user.id);
    }
    const [bulletRows,reportRows]=await Promise.all([dataRequest('bullets',{query:'select=*&order=updated_at.desc'}),dataRequest('reports',{query:'select=*&order=updated_at.desc'})]);
    savedBullets=(bulletRows||[]).map(row=>({schemaVersion:1,id:row.id,title:row.title,source:row.source||'',output:row.output||'',rules:Array.isArray(row.rules)?row.rules:[],createdAt:row.created_at,updatedAt:row.updated_at}));
    savedReports=(reportRows||[]).map(row=>({schemaVersion:1,id:row.id,title:row.title,type:row.report_type==='OPB'?'OPB':'EPB',data:row.report_data||{},createdAt:row.created_at,updatedAt:row.updated_at}));
    storeBullets(savedBullets);storeReports(savedReports);reloadLocalLibraries();
  }catch(error){$('#savedStatus').textContent=`Account connected; cloud storage needs setup: ${error.message}`;$('#savedReportsStatus').textContent=$('#savedStatus').textContent}
}
async function restoreAccountSession(){
  if(!authSession?.refresh_token)return;
  try{const refreshed=await authRequest('token?grant_type=refresh_token',{body:{refresh_token:authSession.refresh_token}});saveAuthSession(refreshed);await initializeAccountStorage()}
  catch{saveAuthSession(null);reloadLocalLibraries()}
}
async function consumeAuthCallback(){
  const params=new URLSearchParams(location.hash.replace(/^#/,''));const access_token=params.get('access_token'),refresh_token=params.get('refresh_token');
  if(!access_token)return false;
  try{const user=await authRequest('user',{method:'GET',token:access_token});saveAuthSession({access_token,refresh_token,user,expires_in:Number(params.get('expires_in'))||3600,token_type:params.get('token_type')||'bearer'});history.replaceState(null,'',location.pathname+location.search);renderAccount();accountDialog.showModal();$('#accountStatus').textContent=params.get('type')==='recovery'?'Enter a new password below.':'Email verified. You are signed in.';await initializeAccountStorage();return true}catch{return false}
}

setReportType('EPB');updateReportCounts();showSavedReports();
void consumeAuthCallback().then(consumed=>{if(!consumed)return restoreAccountSession()});
