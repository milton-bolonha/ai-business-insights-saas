const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";

async function makeAdmin() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    
    // Altere o email abaixo para o seu email de login
    const targetEmail = "[EMAIL_ADDRESS]"; 

    const result = await db.collection("users").updateOne(
      { email: targetEmail },
      { $set: { role: "admin" } }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Usuário ${targetEmail} promovido para admin com sucesso!`);
    } else {
      console.log(`⚠️ Usuário ${targetEmail} não encontrado ou já era admin.`);
    }

  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await client.close();
  }
}

makeAdmin();
