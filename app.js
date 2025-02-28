let model;
const resultDiv = document.getElementById('result');
const imageInput = document.getElementById('imageInput');
const detectBtn = document.getElementById('detectBtn');
let imageElement;

// 加载 COCO-SSD 模型
cocoSsd.load().then(loadedModel => {
  model = loadedModel;
  resultDiv.innerHTML = "模型加载完毕，请选择图片。";
});

// 监听图片选择
imageInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      // 如果之前有图片则移除
      if (imageElement) {
        imageElement.remove();
      }
      imageElement = new Image();
      imageElement.src = e.target.result;
      imageElement.style.maxWidth = '90%';
      // 将图片插入页面中
      document.body.appendChild(imageElement);
    }
    reader.readAsDataURL(file);
  }
});

// 识别按钮点击事件
detectBtn.addEventListener('click', async () => {
  if (!model) {
    resultDiv.innerHTML = "模型尚未加载，请稍候。";
    return;
  }
  if (!imageElement) {
    resultDiv.innerHTML = "请先选择图片。";
    return;
  }
  resultDiv.innerHTML = "正在识别，请稍候...";

  // 确保图片加载完成
  await new Promise(resolve => {
    if (imageElement.complete) {
      resolve();
    } else {
      imageElement.onload = resolve;
    }
  });

  // 使用模型检测图片
  const predictions = await model.detect(imageElement);

  // 假设识别结果中类别为 "book" 的对象即代表作业本
  let count = predictions.filter(pred => pred.class === 'book').length;

  resultDiv.innerHTML = "识别结果：检测到 " + count + " 本作业。";
});

// 注册 Service Worker 实现离线缓存
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(registration => {
      console.log('Service Worker 注册成功，作用域：', registration.scope);
    })
    .catch(err => {
      console.error('Service Worker 注册失败：', err);
    });
}
