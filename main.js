const firebaseConfig = {
  apiKey: "AIzaSyA-8ZGTADv1hTrmI3JEeQgjn7LcMvn-sRQ",
  authDomain: "chatapp-cb160.firebaseapp.com",
  databaseURL: "https://chatapp-cbb21-default-rtdb.firebaseio.com/",
  projectId: "chatapp-cbb21",
  storageBucket: "chatapp-cbb21.appspot.com",
  messagingSenderId: "1015121268363",
  appId: "1:1015121268363:web:662cb84dcbcf58b4c74e8e"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const messagesDiv=document.getElementById("messages"), inputArea=document.getElementById("inputArea"),
loginContainer=document.getElementById("loginContainer"), onlineStatus=document.getElementById("onlineStatus"),
typingIndicator=document.getElementById("typingIndicator"), bottomButtons=document.getElementById("bottomButtons"),
headerButtons=document.getElementById("headerButtons"), exitGroupBtn=document.getElementById("exitGroupBtn"),
groupIndicator=document.getElementById("groupIndicator");

let username="",email="",currentGroup="everyone",typingTimeout;

// --- Login ---
window.addEventListener("load", ()=>{
  const savedName=localStorage.getItem("username");
  const savedEmail=localStorage.getItem("email");
  const savedGroup=localStorage.getItem("currentGroup")||"everyone";
  if(savedName && savedEmail){ username=savedName; email=savedEmail; currentGroup=savedGroup; showChat(); }
});
document.getElementById("loginBtn").addEventListener("click", ()=>{
  const nameVal=document.getElementById("nameInput").value.trim();
  const emailVal=document.getElementById("emailInput").value.trim();
  if(nameVal && emailVal){ username=nameVal; email=emailVal.replace(/\./g,'_'); localStorage.setItem("username", username); localStorage.setItem("email", email); showChat(); }
  else alert("Enter name & email");
});
function showChat(){ loginContainer.style.display="none"; inputArea.style.display="flex"; bottomButtons.style.display="flex"; onlineStatus.innerText="Online"; setUserOnline(true); showAdminButton(); showGroupButtons(); updateGroupUI(); listenTyping(); loadMessages(); updateGroupIndicator(); }

// --- Online ---
function setUserOnline(status){ const userRef=db.ref('users/'+email); userRef.set({online:status,name:username,group:currentGroup}); userRef.onDisconnect().set({online:false,name:username,group:currentGroup}); }

// --- Typing ---
const typingRef=db.ref('typing');
function listenTyping(){ db.ref('typing').on('value', snap=>{ const data=snap.val(); if(data && data.email!==email && data.group===currentGroup) typingIndicator.innerText=data.name+" is typing..."; else typingIndicator.innerText=""; }); }
document.getElementById("messageInput").addEventListener("input", ()=>{ typingRef.set({name:username,email:email,group:currentGroup}); clearTimeout(typingTimeout); typingTimeout=setTimeout(()=>typingRef.remove(),1000); });

// --- Send Message ---
function sendMessage(){ const msg=document.getElementById("messageInput").value.trim(); if(!msg) return; const now=new Date(); const time=now.getHours().toString().padStart(2,'0')+":"+now.getMinutes().toString().padStart(2,'0'); db.ref("messages/"+currentGroup).push().set({name:username,email:email,text:msg,time:time,deleted:false}); document.getElementById("messageInput").value=""; typingRef.remove(); }

// --- Messages ---
function loadMessages(){ messagesDiv.innerHTML=""; db.ref("messages/"+currentGroup).off(); db.ref("messages/"+currentGroup).on("child_added", snap=>{ renderMessage(snap); const data=snap.val(); if(data && data.email!==email && !data.deleted) showToast(`${data.name}: ${data.text}`); }); db.ref("messages/"+currentGroup).on("child_changed", renderMessage); }
function renderMessage(snap){ const data=snap.val(); if(!data) return; const key=snap.key; let div=document.getElementById("msg-"+key); if(!div){ div=document.createElement("div"); div.id="msg-"+key; div.classList.add("msg"); div.classList.add(data.email===email?'sent':'received'); if(data.email===email){ div.addEventListener('click', ()=>{ if(confirm("Delete this message?")) db.ref("messages/"+currentGroup+"/"+key).update({text:"This message was deleted",deleted:true}); }); } messagesDiv.appendChild(div); } div.innerHTML=data.deleted?`<div class="deleted">This message was deleted</div>`:`<strong>${data.name}</strong><br>${data.text}<div class="time">${data.time}</div>`; messagesDiv.scrollTop=messagesDiv.scrollHeight; }

// --- Clear & Logout ---
function clearAllForMe(){ messagesDiv.innerHTML=''; alert("Chat cleared from your screen"); }
function logout(){ localStorage.removeItem("username"); localStorage.removeItem("email"); localStorage.removeItem("currentGroup"); onlineStatus.innerText="Offline"; inputArea.style.display="none"; bottomButtons.style.display="none"; loginContainer.style.display="flex"; messagesDiv.innerHTML=""; headerButtons.innerHTML=""; groupIndicator.innerText=""; alert("Logged out!"); }

// --- Admin ---
function showAdminButton(){ const adminEmail="pratik@gmail.com".replace(/\./g,"_"); if(email===adminEmail){ const btnDel=document.createElement("button"); btnDel.innerHTML="🧹 Delete All"; btnDel.style.background="#b91c1c"; btnDel.style.color="white"; btnDel.onclick=()=>{ if(confirm("Delete ALL chats for everyone?")) db.ref("messages/"+currentGroup).remove().then(()=>alert("Deleted!")); }; headerButtons.appendChild(btnDel); const btnCreate=document.createElement("button"); btnCreate.innerHTML="➕ New Group"; btnCreate.style.background="white"; btnCreate.style.color="#000"; btnCreate.onclick=()=>{ const gname=prompt("Enter group name"); const gpass=prompt("Enter group passkey"); if(gname && gpass){ db.ref("groups/"+gname).set({passkey:gpass}); alert("Group created!"); } }; headerButtons.appendChild(btnCreate); } }

// --- Groups ---
function showGroupButtons(){ const joinBtn=document.createElement("button"); joinBtn.innerHTML="📋 Join Group"; joinBtn.style.background="#005c4b"; joinBtn.style.color="white"; joinBtn.onclick=joinGroupPrompt; headerButtons.appendChild(joinBtn); }
function joinGroupPrompt(){ db.ref("groups").get().then(snap=>{ if(!snap.exists()){alert("No secret groups"); return;} const groups=snap.val(); const gnames=Object.keys(groups); const gname=prompt("Available groups:\n"+gnames.join("\n")+"\n\nEnter group name to join:"); if(gname && groups[gname]){ const key=prompt("Enter passkey for "+gname); if(key===groups[gname].passkey){ currentGroup=gname; localStorage.setItem("currentGroup",currentGroup); updateGroupUI(); loadMessages(); updateGroupIndicator(); alert("✅ Joined "+gname); } else alert("❌ Wrong passkey!"); } }); }
function exitGroup(){ currentGroup="everyone"; localStorage.setItem("currentGroup",currentGroup); updateGroupUI(); loadMessages(); updateGroupIndicator(); alert("Exited group, back to Everyone"); }
function updateGroupUI(){ exitGroupBtn.style.display=currentGroup==="everyone"?"none":"inline-block"; }
function updateGroupIndicator(){ groupIndicator.innerText=currentGroup==="everyone"?"":"🔒 "+currentGroup; }

// --- Toast ---
function showToast(msg){ const t=document.createElement("div"); t.className="toast"; t.innerText=msg; document.body.appendChild(t); setTimeout(()=>t.classList.add("show"),100); setTimeout(()=>{ t.classList.remove("show"); setTimeout(()=>document.body.removeChild(t),400); },3000); }