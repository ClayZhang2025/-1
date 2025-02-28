let cropper; // Cropper.js 实例
let croppedMat; // 裁剪后的 OpenCV Mat
let srcMat; // 原始图像的 Mat

function onOpenCvReady() {
  console.log('OpenCV.js 加载完成');
  document.getElementById('result').innerHTML = 'OpenCV 加载完成，请选择图片';
}

const imageInput = document.getElementById('imageInput');
const startCropBtn = document.getElementById('startCropBtn');
const detectBtn = document.getElementById('detectBtn');
const resultDiv = document.getElementById('result');
const imagePreview = document.getElementById('imagePreview');
const canvasOutput = document.getElementById('canvasOutput');

// 监听文件选择，加载图片到 imagePreview 中，并初始化 Cropper
imageInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    imagePreview.src = e.target.result;
    imagePreview.style.display = 'block';
    // 初始化 Cropper
    if (cropper) {
      cropper.destroy();
    }
    cropper = new Cropper(imagePreview, {
      aspectRatio: NaN, // 自由选择区域，可根据需求固定比例
      viewMode: 1
    });
    // 显示“确定选择区域”按钮
    startCropBtn.style.display = 'inline-block';
  }
  reader.readAsDataURL(file);
});

// 当用户点击“确定选择区域”按钮后，获取裁剪区域并转换为 OpenCV Mat
startCropBtn.addEventListener('click', () => {
  if (!cropper) return;
  // 获取裁剪后的 Canvas 对象
  const croppedCanvas = cropper.getCroppedCanvas();
  if (!croppedCanvas) {
    resultDiv.innerHTML = '裁剪失败，请重试。';
    return;
  }
  // 将裁剪后的区域显示到 canvasOutput 上
  canvasOutput.width = croppedCanvas.width;
  canvasOutput.height = croppedCanvas.height;
  const ctx = canvasOutput.getContext('2d');
  ctx.drawImage(croppedCanvas, 0, 0);
  
  // 使用 OpenCV.js 读取裁剪后的图像
  croppedMat = cv.imread(canvasOutput);
  resultDiv.innerHTML = '区域选择完成，点击开始识别';
  
  // 隐藏区域选择按钮，显示识别按钮
  startCropBtn.style.display = 'none';
  detectBtn.style.display = 'inline-block';
});

// 检测函数：使用 OpenCV.js 对裁剪后的图像进行处理
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
  
  // 转换为灰度图
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  // 高斯模糊
  cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);
  // Canny 边缘检测
  cv.Canny(blurred, edges, 50, 150, 3, false);
  
  // 霍夫直线检测（概率霍夫变换）
  let lines = new cv.Mat();
  cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 80, 30, 10);
  
  let verticalLines = [];
  for (let i = 0; i < lines.rows; ++i) {
    let line = lines.data32S.slice(i * 4, i * 4 + 4);
    let x1 = line[0], y1 = line[1], x2 = line[2], y2 = line[3];
    // 判断竖直：计算线条角度，保留角度接近 90° 的线条
    let angle = Math.atan2(y2 - y1, x2 - x1);
    if (Math.abs(angle) > Math.PI/3) { // 这里用 60° 作为判断阈值，可根据实际情况调整
      verticalLines.push({x1, y1, x2, y2});
      // 在原图上画出检测到的线
      cv.line(src, new cv.Point(x1, y1), new cv.Point(x2, y2), [255, 0, 0, 255], 2);
    }
  }
  
  // 显示处理结果到 canvasOutput
  cv.imshow(canvasOutput, src);
  resultDiv.innerHTML = '检测到大约 ' + verticalLines.length + ' 条竖直线条（可能对应书脊数量）';
  
  // 释放内存
  src.delete(); gray.delete(); blurred.delete(); edges.delete(); lines.delete();
});
