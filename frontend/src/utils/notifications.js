export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const showNotification = (title, options = {}) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    const defaultOptions = {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      silent: false,
    };

    const notification = new Notification(title, { ...defaultOptions, ...options });
    
    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
    
    return notification;
  }
};

export const playNotificationSound = () => {
  try {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.play();
  } catch (err) {
    console.error("Failed to play sound:", err);
  }
};
