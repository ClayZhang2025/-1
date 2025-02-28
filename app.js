console.log("app.js 已加载并开始执行");

// app.js

function initApp() {
  const imageInput = document.getElementById('imageInput');
  const startCropBtn = document.getElementById('startCropBtn');
  const detectBtn = document.getElementById('detectBtn');
  const resultDiv = document.getElementById('result');
  const imagePreview = document.getElementById('imagePreview');
  const canvasOutput = document.getElementById('canvasOutput');

  let cropper;     // Cropper.js 实例
  let croppedMat;  // 裁剪后的 OpenCV Mat

  // 监听文件选择，加载图片并初始化 Cropper
  imageInput.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      imagePreview.src = e.target.result;
      imagePreview.style.display = 'block';
      // 如果之前已创建 cropper，先销毁它
      if (cropper) {
        cropper.destroy();
      }
      cropper = new Cropper(imagePreview, {
        aspectRatio: NaN, // 自由裁剪区域，可根据需求固定比例
        viewMode: 1
      });
      // 显示“确定选择区域”按钮
      startCropBtn.style.display = 'inline-block';
      resultDiv.innerHTML = '图片加载成功，请选择需要识别的区域';
    }
    reader.readAsDataURL(file);
  });

  // 当用户点击“确定选择区域”按钮时，获取裁剪区域并转换为 OpenCV Mat
  startCropBtn.addEventListener('click', () => {
    if (!cropper) return;
    const croppedCanvas = cropper.getCroppedCanvas();
    if (!croppedCanvas) {
      resultDiv.innerHTML = '裁剪失败，请重试';
      return;
    }
    // 将裁剪后的区域绘制到 canvas 上
    canvasOutput.width = croppedCanvas.width;
    canvasOutput.height = croppedCanvas.height;
    const ctx = canvasOutput.getContext('2d');
    ctx.drawImage(croppedCanvas, 0, 0);
    
    // 使用 OpenCV.js 从 canvas 读取图像
    croppedMat = cv.imread(canvasOutput);
    resultDiv.innerHTML = '区域选择完成，请点击“开始识别”';
    
    // 隐藏区域选择按钮，显示识别按钮
    startCropBtn.style.display = 'none';
    detectBtn.style.display = 'inline-block';
  });

  // 当用户点击“开始识别”按钮时，执行图像处理（边缘检测、霍夫直线检测）
  detectBtn.addEventListener('click', () => {
    if (!croppedMat) {
      resultDiv.innerHTML = '请先选择图片并裁剪区域';
      return;
    }
    
    // 克隆裁剪后的 Mat 进行处理
    let src = croppedMat.clone();
    let gray = new cv.Mat();
    let blurred = new cv.Mat();
    let edges = new cv.Mat();

    // 转换为灰度图像
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    // 高斯模糊
    cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);
    // Canny 边缘检测
    cv.Canny(blurred, edges, 50, 150, 3, false);

    // 霍夫直线检测（使用概率霍夫变换）
    let lines = new cv.Mat();
    cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 80, 30, 10);

    let verticalLines = [];
    for (let i = 0; i < lines.rows; i++) {
      let line = lines.data32S.slice(i * 4, i * 4 + 4);
      let x1 = line[0], y1 = line[1], x2 = line[2], y2 = line[3];
      // 计算线段角度
      let angle = Math.atan2(y2 - y1, x2 - x1);
      // 判断是否近似竖直（角度绝对值大于 60°，即 Math.PI/3）
      if (Math.abs(angle) > Math.PI / 3) {
        verticalLines.push({ x1, y1, x2, y2 });
        // 在原图上画出检测到的竖直线
        cv.line(src, new cv.Point(x1, y1), new cv.Point(x2, y2), [255, 0, 0, 255], 2);
      }
    }

    // 将处理后的图像显示在 canvas 上
    cv.imshow(canvasOutput, src);
    resultDiv.innerHTML = '检测到大约 ' + verticalLines.length + ' 条竖直线条（可能对应书脊数量）';

    // 释放内存
    src.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    lines.delete();
  });
}

// 等待 OpenCV.js 运行时初始化完成后，启动整个应用
if (typeof cv !== 'undefined') {
  cv.onRuntimeInitialized = function() {
    console.log("OpenCV.js 运行时初始化完成，现在可以调用所有 API");
    initApp();
  };
} else {
  console.error("cv 未定义，请检查 OpenCV.js 是否正确加载");
}
