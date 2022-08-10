import React from 'react';
import { View, Text } from '@tarojs/components';
import { AtButton, AtForm, AtInput, AtInputNumber } from 'taro-ui';
import './index.scss';
import { useState } from 'react';

interface IndexProps {}

const Index: React.FC<IndexProps> = () => {
  const [number, setNumber] = useState<string>();
  return (
    <View className="index">
      <AtForm>
        <AtInput
          name="number"
          title="数字"
          type="number"
          placeholder="请输入数字"
          value={number}
          onChange={value => {
            console.info(value, typeof value);
            setNumber(String(value));
          }}
        />
        <AtButton type="primary">I need Taro UI</AtButton>
        <AtButton type="primary" circle>
          <Text>Taro UI 支持 Vue3 了吗？</Text>
          支持
        </AtButton>
        <Text>共建？</Text>
        <AtButton type="secondary" circle={true}>
          来
        </AtButton>
      </AtForm>
    </View>
  );
};

export default Index;
