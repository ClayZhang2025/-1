// 当 OpenCV 加载完成后调用
function onOpenCvReady() {
  console.log('OpenCV.js 加载完成');
  document.getElementById('result').innerHTML = 'OpenCV 加载完成，请选择图片';
}

const imageInput = document.getElementById('imageInput');
const detectBtn = document.getElementById('detectBtn');
const resultDiv = document.getElementById('result');
const canvasOutput = document.getElementById('canvasOutput');
let srcMat; // 用于存储上传图片的 Mat

// 监听文件选择，加载图片到 canvas 上
imageInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    let img = new Image();
    img.onload = function() {
      // 创建 canvas 显示图片
      canvasOutput.width = img.width;
      canvasOutput.height = img.height;
      let ctx = canvasOutput.getContext('2d');
      ctx.drawImage(img, 0, 0);
      // 将 canvas 内容转换为 OpenCV Mat
      srcMat = cv.imread(canvasOutput);
      resultDiv.innerHTML = '图片加载成功，点击开始识别';
    }
    img.src = e.target.result;
  }
  reader.readAsDataURL(file);
});

// 检测函数：使用 OpenCV.js 进行边缘检测和霍夫直线检测
detectBtn.addEventListener('click', () => {
  if (!srcMat) {
    resultDiv.innerHTML = '请先选择图片';
    return;
  }
  
  // 复制原始图像到一个 Mat
  let src = srcMat.clone();
  let gray = new cv.Mat();
  let blurred = new cv.Mat();
  let edges = new cv.Mat();
  
  // 转换为灰度图
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  // 高斯模糊
  cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);
  // Canny 边缘检测
  cv.Canny(blurred, edges, 50, 150, 3, false);
  
  // 霍夫直线检测（使用概率霍夫变换）
  let lines = new cv.Mat();
  cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 80, 30, 10);
  
  // 筛选近似竖直的直线
  let verticalLines = [];
  for (let i = 0; i < lines.rows; ++i) {
    let line = lines.data32S.slice(i * 4, i * 4 + 4);
    let x1 = line[0], y1 = line[1], x2 = line[2], y2 = line[3];
    // 判断竖直程度：计算角度，角度接近 90° 或 -90°（用弧度表示为接近 Math.PI/2 或 -Math.PI/2）
    let angle = Math.atan2(y2 - y1, x2 - x1);
    if (Math.abs(angle) > Math.PI/3) { // 可根据实际情况调整（例如 60° 以上视为竖直）
      verticalLines.push({x1, y1, x2, y2});
      // 在原图上画出检测到的线
      cv.line(src, new cv.Point(x1, y1), new cv.Point(x2, y2), [255, 0, 0, 255], 2);
    }
  }
  
  // 显示处理后的图片
  cv.imshow(canvasOutput, src);
  resultDiv.innerHTML = '检测到大约 ' + verticalLines.length + ' 条竖直线条（即可能的书脊数量）';
  
  // 释放内存
  src.delete(); gray.delete(); blurred.delete(); edges.delete(); lines.delete();
});

