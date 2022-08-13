import './app.scss';
import 'taro-ui/dist/style/index.scss';

// Taro 额外添加的 hooks 要从 '@tarojs/taro' 中引入
import Taro, { useDidShow, useDidHide, useReady } from '@tarojs/taro';

function App(props) {
  // 对应 onHide
  useDidHide(() => {});

  return props.children;
}

export default App;
