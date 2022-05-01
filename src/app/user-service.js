const admin = require("firebase-admin");
const db = admin.firestore();

module.exports = {
    createUser: async (id, email, username, viewer = '', location = '🌎') => {
        const docRef = db.collection('users').doc(email)
        await docRef.set({
            id: id,
            email: email,
            username: username,
            viewer: viewer,
            location: location,
        })
    },

    updateUser: async (email, username, viewer = '', location = '🌎') => {
        const docRef = db.collection('users').doc(email)
        await docRef.update({
            email: email,
            username: username,
            viewer: viewer,
            location: location,
        })
    },

    getUserByEmail: async (email) => {
        const snapshot = await db.collection('users').doc(email).get();
        return snapshot.data();
    }
}