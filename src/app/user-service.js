const admin = require("firebase-admin");
const db = admin.firestore();

module.exports = {
    createUser: async (id, email, username) => {
        const docRef = db.collection('users').doc(id)
        await docRef.set({
            id: id,
            email: email,
            username: username,
        })
    }
}