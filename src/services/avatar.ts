export const avatarInitial = (displayName: string, email: string) => {
  const source = displayName || email || "记";
  return source.trim().slice(0, 1).toUpperCase() || "记";
};

export const resizeAvatarFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("头像读取失败"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("头像格式无法识别"));
      image.onload = () => {
        const size = 360;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("当前浏览器无法处理头像"));
          return;
        }

        const sourceSize = Math.min(image.width, image.height);
        const sourceX = (image.width - sourceSize) / 2;
        const sourceY = (image.height - sourceSize) / 2;
        context.fillStyle = "#f8f5ee";
        context.fillRect(0, 0, size, size);
        context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
