import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SelectProps, Spin, Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { SelectValue } from 'antd/lib/select';
import debounce from 'lodash/debounce';

export interface BaseRemoteSearchSelectProps<T, R> extends
  Omit<SelectProps<T>, 'children' | 'options' | 'filterOption' | 'showSearch' | 'onSearch' | 'onChange'> {
  remoteLoadData?(search?: string): Promise<R[]>;
  /** 默认 label */
  remoteDataLabel?: keyof R;
  /** 默认 value */
  remoteDataValue?: keyof R;
  /** 异步加载数据在条件不足时，禁用显示文案 */
  remotePendding?: string;
  onChange?(value: T, item: R): void;
  onChange? (value?: T, item?: R): void;
}

export default function BaseRemoteSearchSelect <T extends SelectValue = SelectValue, R extends object = {}> ({
  remoteLoadData,
  remotePendding,
  remoteDataLabel = 'label' as any,
  remoteDataValue = 'value' as any,
  value,
  onChange,
  ...props
}: BaseRemoteSearchSelectProps<T, R>) {
  const [searching, setSearching] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [options, setOptions] = useState<{ label: string; value: string; props: R }[]>([]);
  const timmer = useRef<NodeJS.Timeout>();
  const search = useRef('');
  const fetchId = useRef(0);

  useEffect(() => {
    search.current = '';
    setCurrentValue(value);
  }, [value]);

  const loadData = useMemo(() => debounce(() => {
    fetchId.current += 1;
    const current = fetchId.current;
    setOptions([]);
    setSearching(true);

    remoteLoadData?.(search.current).then(res => {
      if (current === fetchId.current) {
        setOptions(res.map(item => ({ label: item[remoteDataLabel] as any, value: item[remoteDataValue] as any, props: item })));
        setSearching(false);
      }
    }).catch(() => {
      setSearching(false);
    });
  }, 800), [remoteLoadData]);

  function _onChange (value?: T, option?: any) {
    if (value !== currentValue) {
      setCurrentValue(value);
      onChange?.(value, option?.props);
    }
  }

  useEffect(() => {
    setSearching(false);
    fetchId.current = 0;
    setCurrentValue(void 0);
    _onChange?.(void 0);
    search.current = '';
    !remotePendding && loadData();
    return () => {
      clearTimeout(timmer.current!);
    };
  }, [remotePendding, remoteLoadData]);

  function onSearch (value: string) {
    search.current = value;
    loadData();
  }

  if (remotePendding) {
    return <Select<any> {...props} value={remotePendding} disabled />;
  }

  return (
    <Select
      filterOption={false}
      showSearch
      suffixIcon={searching ? <LoadingOutlined /> : void 0}
      notFoundContent={searching ? <Spin size="small" style={{ margin: '10px auto', display: 'block' }} /> : void 0}
      options={options}
      onSearch={onSearch}
      {...props}
      value={currentValue}
      onChange={_onChange} />
  );
}
