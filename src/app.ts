import './app.scss';

// Taro 额外添加的 hooks 要从 '@tarojs/taro' 中引入
import Taro, { useDidShow, useDidHide, useReady } from '@tarojs/taro';
import { afterUpdateVersion } from './pages/index';

const updateManager = Taro.getUpdateManager();

updateManager.onCheckForUpdate(function (res) {
  // 请求完新版本信息的回调
  // console.log(res.hasUpdate);
});

updateManager.onUpdateReady(function () {
  Taro.showModal({
    title: '更新提示',
    content: '新版本已经准备好，是否重启应用？',
    success: function (res) {
      if (res.confirm) {
        // afterUpdateVersion();
        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
        updateManager.applyUpdate();
      }
    }
  });
});

updateManager.onUpdateFailed(function () {
  Taro.showToast({
    icon: 'error',
    title: '更新失败'
  });
});

function App(props) {
  // 对应 onHide
  useDidHide(() => {});

  return props.children;
}

export default App;
