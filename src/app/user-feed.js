const casual = require("casual");
const fetch = require("node-fetch");
const uuid = require("uuid");

const admin = require("firebase-admin");
const db = admin.firestore();

module.exports = {
  get: async (userInfo) => {

    const userFeed = [];

    const messages = db.collection('messages');
    const snapshot = await messages.where('postByEmail', 'in', [userInfo.email, userInfo.viewer]).get();

    if (snapshot.empty) {
      return userFeed;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      userFeed.unshift({
        name: data.postByName,
        nameHandle: data.postByEmail,
        message: data.message,
        timestamp: data.timestamp,
        postAt: data.postAt,
        location: data.location,
        wishornote: data.wishornote,
      });
    });

    userFeed.sort(function (a, b) {
      var keyA = a.timestamp,
        keyB = b.timestamp;
      if (keyA > keyB) return -1;
      if (keyA < keyB) return 1;
      return 0;
    });

    return userFeed;
  },

  add: async (message, userInfo, wishornote) => {
    const id = uuid.v4();
    const time = new Date();
    const postAt = time.getHours() + ':' + time.getMinutes() + ', ' + (time.getMonth() + 1) + '/' + time.getDate() + '/' + time.getFullYear();
    const docRef = db.collection('messages').doc(id)
    await docRef.set({
      messageID: id,
      message: message,
      timestamp: time,
      postAt: postAt,
      postByEmail: userInfo.email,
      postByName: userInfo.username,
      location: userInfo.location,
      viewBy: userInfo.viewer,
      wishornote: wishornote,
    });

  },

};