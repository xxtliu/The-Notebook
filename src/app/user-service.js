const admin = require("firebase-admin");
const db = admin.firestore();

module.exports = {
    createUser: async (id, email, username) => {
        const docRef = db.collection('users').doc(email)
        await docRef.set({
            id: id,
            email: email,
            username: username,
        })
    },

    getUserByEmail: async (email) => {
        const snapshot = await db.collection('users').doc(email).get();
        return snapshot.data();
    }
}