const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const projectName = 'chore-reward-app';
if (!fs.existsSync(projectName)) fs.mkdirSync(projectName);

// Helper to write files
const writeFile = (filePath, content) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content);
};

// --- Project Files ---
writeFile(`${projectName}/package.json`, `{
  "name": "chore-reward-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "firebase": "^10.16.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.3"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}`);

writeFile(`${projectName}/tailwind.config.js`, `module.exports = { content: ["./src/**/*.{js,jsx,ts,tsx}"], theme: { extend: {} }, plugins: [] };`);
writeFile(`${projectName}/postcss.config.js`, `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {}, }, };`);
writeFile(`${projectName}/src/index.css`, `@tailwind base;\n@tailwind components;\n@tailwind utilities;`);
writeFile(`${projectName}/src/firebase.js`, `import { initializeApp } from "firebase/app";\nimport { getFirestore } from "firebase/firestore";\nimport { getAuth } from "firebase/auth";\n\nconst firebaseConfig = {\n  apiKey: "YOUR_API_KEY",\n  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",\n  projectId: "YOUR_PROJECT_ID",\n  storageBucket: "YOUR_PROJECT_ID.appspot.com",\n  messagingSenderId: "YOUR_SENDER_ID",\n  appId: "YOUR_APP_ID"\n};\n\nconst app = initializeApp(firebaseConfig);\nexport const db = getFirestore(app);\nexport const auth = getAuth(app);`);

writeFile(`${projectName}/src/App.jsx`, `import React, { useState } from "react";\nimport ParentDashboard from "./components/ParentDashboard";\nimport KidDashboard from "./components/KidDashboard";\n\nfunction App() {\n  const [userRole, setUserRole] = useState(null);\n  if (!userRole) {\n    return (\n      <div className="flex flex-col items-center justify-center h-screen">\n        <h1 className="text-2xl mb-4">Select Role</h1>\n        <div className="space-x-4">\n          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setUserRole(\"parent\")}>Parent</button>\n          <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={() => setUserRole(\"kid\")}>Kid</button>\n        </div>\n      </div>\n    );\n  }\n  return userRole === \"parent\" ? <ParentDashboard /> : <KidDashboard />;\n}\nexport default App;`);

writeFile(`${projectName}/src/components/ParentDashboard.jsx`, `import React, { useState, useEffect } from "react";\nimport { db } from "../firebase";\nimport { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";\nfunction ParentDashboard() {\n  const [chores, setChores] = useState([]);\n  const [choreTitle, setChoreTitle] = useState(\"\");\n  const [chorePoints, setChorePoints] = useState(\"\");\n  const choresCol = collection(db, "chores");\n  useEffect(() => { const fetchChores = async () => { const snapshot = await getDocs(choresCol); setChores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); }; fetchChores(); }, []);\n  const addChore = async () => { if (!choreTitle || !chorePoints) return; await addDoc(choresCol, { title: choreTitle, points: parseInt(chorePoints), status: \"pending\" }); setChoreTitle(\"\"); setChorePoints(\"\"); const snapshot = await getDocs(choresCol); setChores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); };\n  const approveChore = async (choreId) => { const choreRef = doc(db, \"chores\", choreId); await updateDoc(choreRef, { status: \"approved\" }); const snapshot = await getDocs(choresCol); setChores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); };\n  return (\n    <div className=\"p-6\">\n      <h1 className=\"text-2xl mb-4\">Parent Dashboard</h1>\n      <div className=\"mb-6\">\n        <h2 className=\"text-xl mb-2\">Add Chore</h2>\n        <input type=\"text\" placeholder=\"Chore Title\" value={choreTitle} onChange={e => setChoreTitle(e.target.value)} className=\"border p-1 mr-2\"/>\n        <input type=\"number\" placeholder=\"Points\" value={chorePoints} onChange={e => setChorePoints(e.target.value)} className=\"border p-1 mr-2\"/>\n        <button className=\"bg-blue-500 text-white px-2 py-1 rounded\" onClick={addChore}>Add</button>\n      </div>\n      <div>\n        <h2 className=\"text-xl mb-2\">Chores Pending Approval</h2>\n        <ul>\n          {chores.filter(c => c.status === \"completed\").map(c => (\n            <li key={c.id} className=\"mb-2\">{c.title} - {c.points} pts\n              <button className=\"ml-2 bg-green-500 text-white px-2 py-1 rounded\" onClick={() => approveChore(c.id)}>Approve</button>\n            </li>\n          ))}\n        </ul>\n      </div>\n    </div>\n  );\n}\nexport default ParentDashboard;`);

writeFile(`${projectName}/src/components/KidDashboard.jsx`, `import React, { useState, useEffect } from "react";\nimport { db } from "../firebase";\nimport { collection, getDocs, updateDoc, doc } from "firebase/firestore";\nfunction KidDashboard() {\n  const [chores, setChores] = useState([]);\n  const [coins, setCoins] = useState(0);\n  const choresCol = collection(db, "chores");\n  useEffect(() => { const fetchChores = async () => { const snapshot = await getDocs(choresCol); setChores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); const earned = snapshot.docs.filter(d => d.data().status === \"approved\").reduce((acc,d)=>acc+d.data().points,0); setCoins(earned); }; fetchChores(); }, []);\n  const completeChore = async (choreId) => { const choreRef = doc(db, \"chores\", choreId); await updateDoc(choreRef, { status: \"completed\" }); const snapshot = await getDocs(choresCol); setChores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); };\n  return (\n    <div className=\"p-6\">\n      <h1 className=\"text-2xl mb-4\">Kid Dashboard</h1>\n      <h2 className=\"text-xl mb-4\">Coins: {coins}</h2>\n      <div>\n        <h2 className=\"text-xl mb-2\">Chores</h2>\n        <ul>\n          {chores.filter(c=>c.status===\"pending\").map(c=>(<li key={c.id} className=\"mb-2\">{c.title} - {c.points} pts <button className=\"ml-2 bg-yellow-500 text-white px-2 py-1 rounded\" onClick={()=>completeChore(c.id)}>Done</button></li>))}\n        </ul>\n      </div>\n    </div>\n  );\n}\nexport default KidDashboard;`);

// --- Create zip ---
const output = fs.createWriteStream(`${projectName}.zip`);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => { console.log(`ZIP created: ${archive.pointer()} total bytes`); });
archive.pipe(output);
archive.directory(projectName + '/', false);
archive.finalize();