const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('la-trottola/assets/auth.js', 'utf8');
async function run(page, overrides = {}, url = 'https://example.com/la-trottola/member.html', config) {
  const nodes = Object.fromEntries(['status','member','member-email','sign-out','email','email-form','google','email-submit'].map(id => [id, {hidden: id === 'member', textContent:'', disabled:true, value:'a@example.com', addEventListener(event, fn){this[event] = fn;}}]));
  const redirects = [], history = [];
  let listener;
  const auth = {onAuthStateChange(fn){ listener = fn; },getUser: async()=>({data:{user:{email:'a@example.com'}}}),signOut:async()=>({}),exchangeCodeForSession:async()=>({}),signInWithOtp:async()=>({}),signInWithOAuth:async()=>({}),...overrides};
  const context = {URL, setTimeout, document:{body:{dataset:{page}},getElementById:id=>nodes[id],querySelectorAll:()=>[nodes.email,nodes.google,nodes['email-submit']]},location:{href:url,pathname:new URL(url).pathname,replace:u=>redirects.push(u)},history:{replaceState:(...args)=>history.push(args)},addEventListener(){},window:{LA_TROTTOLA_CONFIG:config ?? {supabaseUrl:'https://project.supabase.co',supabasePublishableKey:'sb_publishable_test'},supabase:{createClient:()=>({auth})}}};
  await vm.runInNewContext(source, context);
  return {nodes, redirects, history, listener};
}
test('missing configuration fails closed', async()=>{
 const r=await run('member',{},undefined,{});
 assert.equal(r.nodes.member.hidden,true); assert.match(r.nodes.status.textContent,/unavailable/);
});
test('unverified user cannot reveal member interface',async()=>{
 const r=await run('member',{getUser:async()=>({data:{user:null},error:{}})});
 assert.equal(r.nodes.member.hidden,true); assert.match(r.redirects[0],/signin.html$/);
});
test('verified identity is rendered as text and sign-out hides it',async()=>{
 const r=await run('member'); assert.equal(r.nodes.member.hidden,false);
 assert.equal(r.nodes['member-email'].textContent,'a@example.com');
 r.listener('SIGNED_OUT',null); assert.equal(r.nodes.member.hidden,true);
 assert.equal(r.nodes['member-email'].textContent,'');
});
test('callback exchanges code and clears URL before navigation',async()=>{
 let code;
 const r=await run('callback',{exchangeCodeForSession:async c=>{code=c;return {}; }},'https://example.com/la-trottola/callback.html?code=one-time');
 assert.equal(code,'one-time'); assert.equal(r.history[0][2],'/la-trottola/callback.html');
 assert.match(r.redirects[0],/member.html$/);
});
test('failed callback does not navigate to member page',async()=>{
 const r=await run('callback',{exchangeCodeForSession:async()=>({error:{}})},'https://example.com/la-trottola/callback.html?code=expired');
 assert.equal(r.redirects.length,0); assert.match(r.nodes.status.textContent,/fresh link/);
});
test('magic link uses fixed callback and generic response',async()=>{
 let request;
 const r=await run('login',{signInWithOtp:async data=>{request=data;return {}; }},'https://example.com/la-trottola/index.html?next=https://evil.example');
 await r.nodes['email-form'].submit({preventDefault(){}});
 assert.equal(request.options.emailRedirectTo,'https://example.com/la-trottola/callback.html');
 assert.match(r.nodes.status.textContent,/Check your inbox/); assert.equal(r.nodes.google.disabled,false);
});
test('network failure keeps member data hidden',async()=>{
 const r=await run('member',{getUser:async()=>{throw Error('offline');}});
 assert.equal(r.nodes.member.hidden,true); assert.match(r.nodes.status.textContent,/unavailable/);
});
