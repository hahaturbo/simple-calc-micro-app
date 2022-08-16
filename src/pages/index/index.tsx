import React, { useEffect, useRef } from 'react';
import { View, Text } from '@tarojs/components';
import { AtButton, AtInput, AtInputNumber, AtTag, AtToast } from 'taro-ui';
import './index.scss';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { create, all } from 'mathjs';

// create a mathjs instance with configuration
const math = create(all, {
  precision: 16,
  number: 'BigNumber'
});

interface IndexProps {}

interface SourceType {
  unitPrice: string[];
  count: string[];
  needPrice: string;
  lessPrice: string;
}

interface ResultType {
  total: string;
  totalLess?: string;
  realTotal?: string;
  lessUnit?: string[];
  avgUnit?: string;
}

const defaultSource: SourceType = {
  unitPrice: ['59.8'],
  count: ['30'],
  needPrice: '150',
  lessPrice: '30'
};

const storageKey = 'source2';

const getStorageSource = (): undefined | SourceType => {
  try {
    const res = Taro.getStorageSync<string>(storageKey);
    if (res) {
      const result = JSON.parse(res) as SourceType | undefined;
      return result;
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
};

export const afterUpdateVersion = () => {
  Taro.removeStorage({ key: 'source' });
};

const calcResult = (dataSource?: SourceType): ResultType | undefined => {
  if (!dataSource) return;
  const result: ResultType = {} as ResultType;
  const originTotalList: Map<number, string> = new Map();
  if (dataSource?.count && dataSource?.unitPrice) {
    result.total = math.format(
      dataSource.unitPrice.reduce((pre, cur, index) => {
        if (cur && dataSource.count[index]) {
          const currentTotal = math.multiply(
            math.bignumber(math.evaluate(cur)),
            math.bignumber(math.evaluate(dataSource.count[index]))
          );
          originTotalList.set(index, math.format(currentTotal, { notation: 'fixed' }));
          return math.add(math.bignumber(pre), currentTotal);
        }
        return pre;
      }, 0),
      { notation: 'fixed' }
    );
    if (dataSource?.needPrice && dataSource?.lessPrice && result.total) {
      result.totalLess = math.format(
        math.multiply(
          math.floor(
            math.evaluate(
              math.format(
                math.divide(math.bignumber(result.total), math.bignumber(math.evaluate(dataSource.needPrice)))
              )
            )
          ),
          math.bignumber(math.evaluate(dataSource.lessPrice))
        ),
        { notation: 'fixed' }
      );

      result.realTotal = math.format(
        math.chain(math.bignumber(result.total)).subtract(math.bignumber(result.totalLess)).done(),
        { notation: 'fixed' }
      );
      result.lessUnit = dataSource.count.map((curCount, index) => {
        if (originTotalList.get(index) && result.realTotal) {
          return math.format(
            math.divide(
              math.multiply(
                math.divide(
                  math.bignumber(math.evaluate(originTotalList.get(index)!)),
                  math.bignumber(math.evaluate(result.total))
                ),
                math.bignumber(math.evaluate(result.realTotal))
              ),
              math.bignumber(math.evaluate(curCount))
            ),
            { notation: 'fixed' }
          );
        } else {
          return '';
        }
      });
      if (originTotalList.size && result.realTotal) {
        let allHasCount = 0;
        originTotalList.forEach((curTotal, index) => {
          allHasCount += math.evaluate(dataSource.count[index]);
        });
        result.avgUnit = math.format(
          math.divide(math.bignumber(math.evaluate(result.realTotal)), math.bignumber(allHasCount)),
          { notation: 'fixed' }
        );
      }
    }
  }
  return result;
};

const Index: React.FC<IndexProps> = () => {
  const errorFlagRef = useRef<boolean>(false);
  const [dataSource, setDataSource] = useState<SourceType | undefined>(
    () => getStorageSource() || ({ unitPrice: [] as string[], count: [] as string[] } as SourceType)
  );
  const [dataSourceLen, setDataSourceLen] = useState<number>(() => {
    const source = getStorageSource();
    if (source && Array.isArray(source?.count)) {
      return source.count.length;
    }
    return 1;
  });
  const [result, setResult] = useState<ResultType | undefined>(calcResult(getStorageSource()));

  const [isError, setIsError] = useState<boolean>(false);

  // // 对应 onShow
  // useDidShow(() => {
  //   console.info('ready');
  //   const currentDeviceInfo = Taro.getSystemInfoSync();
  //   console.info('currentDeviceInfo', currentDeviceInfo.theme);
  // });
  useEffect(() => {
    try {
      const result = calcResult(dataSource);
      Taro.setStorageSync(storageKey, JSON.stringify(dataSource));
      setResult(result);
      errorFlagRef.current = false;
    } catch (error) {
      setIsError(true);
      window.setTimeout(() => {
        setIsError(false);
      }, 1500);
      if (!errorFlagRef.current) {
        errorFlagRef.current = true;
        setDataSource(defaultSource);
      }
    }
  }, [dataSource?.unitPrice, dataSource?.count, dataSource?.needPrice, dataSource?.lessPrice]);

  return (
    <View className="index">
      <View className="content">
        <View className="form">
          <View>
            <View className="title" style={{ marginTop: 0 }}>
              基本信息
            </View>
            {Array.isArray(dataSource?.unitPrice) && Array.isArray(dataSource?.count)
              ? new Array(dataSourceLen).fill(null).map((_, index) => {
                  return (
                    <View key={index} style={{ display: 'flex', alignItems: 'center' }}>
                      {dataSourceLen > 1 && (
                        <AtTag type="primary" active>
                          {index + 1}
                        </AtTag>
                      )}
                      <View style={{ display: 'flex', flexDirection: 'column' }}>
                        <AtInput
                          name={`unitPrice${index}`}
                          title="请输入单价"
                          type="digit"
                          placeholder="输入单价，例如59.8"
                          value={dataSource?.unitPrice[index]}
                          onChange={value => {
                            setDataSource(pre => ({
                              ...(pre as SourceType),
                              unitPrice: new Array(dataSourceLen)
                                .fill(null)
                                .map((_, inIndex) =>
                                  inIndex === index ? String(value) : pre!.unitPrice[inIndex] || ''
                                )
                            }));
                          }}
                        />
                        <AtInput
                          name={`count${index}`}
                          title="请输入数量"
                          type="number"
                          placeholder="输入数量，例如30"
                          value={dataSource?.count[index]}
                          onChange={value => {
                            setDataSource(pre => ({
                              ...(pre as SourceType),
                              count: new Array(dataSourceLen)
                                .fill(null)
                                .map((_, inIndex) => (inIndex === index ? String(value) : pre!.count[inIndex] || ''))
                            }));
                          }}
                        />
                      </View>
                    </View>
                  );
                })
              : null}
            <View style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
              <Text style={{ marginRight: '16px', flexShrink: 0 }}>调整种类数量</Text>
              <AtInputNumber
                size="large"
                style={{ flexGrow: 1 }}
                type="number"
                min={1}
                max={20}
                step={1}
                value={dataSourceLen}
                onChange={newLen => {
                  if (newLen < dataSourceLen) {
                    setDataSource(pre => ({
                      ...pre!,
                      count: pre!.count.slice(0, newLen),
                      unitPrice: pre!.unitPrice.slice(0, newLen)
                    }));
                  }
                  setDataSourceLen(newLen);
                }}
              />
            </View>
          </View>
          <View>
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
        </View>
        <View className="title">计算结果</View>
        <View className="result">
          <View className="item">
            <Text className="label">原价：</Text>
            <Text className="content">
              {dataSource?.unitPrice?.map((price, index) => {
                return (
                  <>
                    {price || 0} × {dataSource.count[index] || 0}{' '}
                    {index !== dataSource.unitPrice.length - 1 ? '+' : '='}
                  </>
                );
              })}
              {result?.total}
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
            <View className="content">
              {result?.lessUnit?.map((item, index) => (
                <View style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }} key={index}>
                  {dataSourceLen > 1 && (
                    <AtTag type="primary" active>
                      {index + 1}
                    </AtTag>
                  )}
                  {item}
                </View>
              ))}
            </View>
          </View>
          {dataSourceLen > 1 && result?.avgUnit && (
            <View className="item">
              <Text className="label">平均单价</Text>
              <Text>{result.avgUnit}</Text>
            </View>
          )}
        </View>
      </View>
      <View className="btn-container">
        <AtButton
          type="primary"
          className="btn"
          onClick={() => {
            setDataSource(defaultSource);
            setDataSourceLen(1);
          }}
        >
          重置为默认值
        </AtButton>
      </View>
      <AtToast isOpened={isError} text="数据过大或错误，已自动重置"></AtToast>
    </View>
  );
};

export default Index;
