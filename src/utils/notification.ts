// utils/notifications.ts
export async function askNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("這個瀏覽器不支援桌面通知");
    return
  } else if (Notification.permission !== "denied") {
    return Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        console.log("通知權限被授予");
      }
    });
  }
};

export function sendNewFollowerNotification(name) {
  console.log('嘗試發送通知：', name);

  if (!("Notification" in window)) {
    console.error("此瀏覽器不支持桌面通知");
    return;
  }

  if (Notification?.permission === "granted") {
    console.log(`有權限，新追蹤者 ${name} 關注你了`);
    const notification = new Notification("新追蹤者", {
      body: `${name} 關注你了`
    });
  } else if (Notification?.permission !== "denied") {
    Notification?.requestPermission().then((permission) => {
      console.log(`無權限，新追蹤者 ${name} 關注你了`);
      if (permission === "granted") {
        console.log(`又有權限，新追蹤者 ${name} 關注你了`);
        const notification = new Notification("新追蹤者", {
          body: `${name} 關注你了`
        });
      }
    });
  } else {
    console.error("通知權限被拒絕");
  }
}

export function sendNewMapPublishedNotification(map, name) {
  console.log('嘗試發送通知：', name);

  if (!("Notification" in window)) {
    console.error("此瀏覽器不支持桌面通知");
    return;
  }

  if (Notification?.permission === "granted") {
    console.log(`有權限，${name} 發佈了新地圖 ${map}`);
    const notification = new Notification("新地圖", {
      body: `${name} 發佈了新地圖 ${map}`
    });
  } else if (Notification?.permission !== "denied") {
    Notification?.requestPermission().then((permission) => {
      console.log(`無權限`);
      if (permission === "granted") {
        console.log(`剛才給了權限，${name} 發佈了新地圖 ${map}`);
        const notification = new Notification("新地圖", {
          body: `${name} 發佈了新地圖 ${map}`
        });
      }
    });
  } else {
    console.error("通知權限被拒絕");
  }
}