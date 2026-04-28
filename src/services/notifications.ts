export const notificationStatusText = () => {
  if (!("Notification" in window)) return "当前浏览器不支持通知。";
  if (Notification.permission === "granted") return "浏览器通知已开启。网页打开时，后续可以承接系统通知能力。";
  if (Notification.permission === "denied") return "浏览器通知已被拒绝，可在浏览器设置里重新开启。";
  return "尚未申请浏览器通知权限。";
};

export const requestBrowserNotifications = async () => {
  if (!("Notification" in window)) return notificationStatusText();
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    new Notification("幸福种子银行", { body: "通知权限已开启，后续可承接六次提醒。" });
  }
  return notificationStatusText();
};
