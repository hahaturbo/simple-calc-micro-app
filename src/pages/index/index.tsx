import React, { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import { AtButton, AtCard, AtForm, AtInput } from 'taro-ui';
import './index.scss';
import { useState } from 'react';
import { useDidShow } from '@tarojs/taro';
import Taro from '@tarojs/taro';

import { create, all } from 'mathjs';

// create a mathjs instance with configuration
const math = create(all, {
  precision: 16,
  number: 'BigNumber'
});

interface IndexProps {}

interface SourceType {
  unitPrice: string;
  count: string;
  needPrice: string;
  lessPrice: string;
}

interface ResultType {
  total: string;
  totalLess: string;
  realTotal: string;
  lessUnit: string;
}

const getStorageSource = (): undefined | SourceType => {
  try {
    const res = Taro.getStorageSync<string>('source');
    if (res) {
      return JSON.parse(res);
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
};

const calcResult = (dataSource?: SourceType): ResultType | undefined => {
  if (!dataSource) return;
  const result: ResultType = {} as ResultType;
  if (dataSource?.count && dataSource?.unitPrice) {
    result.total = math.format(
      math.multiply(math.bignumber(Number(dataSource.count)), math.bignumber(Number(dataSource.unitPrice)))
    );
    if (dataSource?.needPrice && dataSource?.lessPrice && result.total) {
      result.totalLess = math.format(
        math.multiply(
          math.floor(Number(math.divide(math.bignumber(result.total), math.bignumber(Number(dataSource.needPrice))))),
          math.bignumber(Number(dataSource.lessPrice))
        )
      );

      result.realTotal = math.format(
        math.chain(math.bignumber(result.total)).subtract(math.bignumber(result.totalLess)).done()
      );
      result.lessUnit = math.format(
        math
          .chain(math.bignumber(result.realTotal))
          .divide(math.bignumber(Number(dataSource.count)))
          .done()
      );
    }
  }
  return result;
};

const Index: React.FC<IndexProps> = () => {
  const [dataSource, setDataSource] = useState<SourceType | undefined>(() => getStorageSource());

  const [result, setResult] = useState<ResultType | undefined>(calcResult(getStorageSource()));

  // // 对应 onShow
  // useDidShow(() => {
  //   console.info('ready');
  //   const currentDeviceInfo = Taro.getSystemInfoSync();
  //   console.info('currentDeviceInfo', currentDeviceInfo.theme);
  // });
  useEffect(() => {
    Taro.setStorageSync('source', JSON.stringify(dataSource));
    setResult(calcResult(dataSource));
  }, [dataSource?.unitPrice, dataSource?.count, dataSource?.needPrice, dataSource?.lessPrice]);

  return (
    <View className="index">
      <View className="form">
        <View>
          <View className="title">基本信息</View>
          <AtInput
            name="unit_price"
            title="请输入单价"
            type="digit"
            placeholder="输入单价，例如59.8"
            value={dataSource?.unitPrice}
            onChange={value => {
              setDataSource(pre => ({ ...(pre as SourceType), unitPrice: String(value) }));
            }}
          />
          <AtInput
            name="dataSource?.count"
            title="请输入数量"
            type="number"
            placeholder="输入数量，例如30"
            value={dataSource?.count}
            onChange={value => {
              setDataSource(pre => ({ ...(pre as SourceType), count: String(value) }));
            }}
          />
        </View>
        <View className="title">折扣信息</View>
        <AtInput
          name="need_price"
          title="每满"
          type="digit"
          placeholder="输入满减金额，例如150"
          value={dataSource?.needPrice}
          onChange={value => {
            setDataSource(pre => ({ ...(pre as SourceType), needPrice: String(value) }));
          }}
        />
        <AtInput
          name="less_price"
          title="减"
          type="digit"
          placeholder="输入折扣金额例如30"
          value={dataSource?.lessPrice}
          onChange={value => {
            setDataSource(pre => ({ ...(pre as SourceType), lessPrice: String(value) }));
          }}
        />
      </View>
      <View className="title">计算结果</View>
      <View className="result">
        <View className="item">
          <Text className="label">原价：</Text>
          <Text className="content">
            {dataSource?.unitPrice} × {dataSource?.count} = {result?.total}
          </Text>
        </View>
        <View className="item">
          <Text className="label">共减去：</Text>
          <Text className="content">{result?.totalLess}</Text>
        </View>
        <View className="item">
          <Text className="label">最终价格：</Text>
          <Text className="content">{result?.realTotal}</Text>
        </View>
        <View className="item">
          <Text className="label">折算单价：</Text>
          <Text className="content">{result?.lessUnit}</Text>
        </View>
      </View>
      <View className="btn-container">
        <AtButton
          type="primary"
          className="btn"
          onClick={() => {
            setDataSource({
              unitPrice: '59.8',
              count: '30',
              needPrice: '150',
              lessPrice: '30'
            });
          }}
        >
          重置为默认值
        </AtButton>
      </View>
    </View>
  );
};

export default Index;
