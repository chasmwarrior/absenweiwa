const m = {
  message: {
    imageMessage: {
      url: "https://mmg.whatsapp.net/v/t62.7118-24/f1/m233/up-xxx",
      mimetype: "image/jpeg",
      contextInfo: {
        isForwarded: true
      }
    },
    extendedTextMessage: {
        text: "hello",
        contextInfo: { isForwarded: true }
    }
  }
};
console.log(m.message?.extendedTextMessage?.contextInfo?.isForwarded || m.message?.imageMessage?.contextInfo?.isForwarded || m.message?.documentMessage?.contextInfo?.isForwarded);
