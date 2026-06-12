# 仓库APP 扫码音频提示语

> 适用场景：备货（揽货）、打包复核、条码绑定
> 说明：数字按变量读出，如 "3 left" / "1 left"（单复数无需区分，"left" 不变）。
> 建议：成功用短促音效+简短语音，错误用明显不同的警示音，作业员靠音色即可不看屏幕判断对错。

## 备货 & 打包（Picking & Packing）

| 中文 | English | 场景 |
| ---- | ---- | ---- |
| 扫码成功，还差3件 | Scan OK, 3 left | 扫码成功，数量未满 |
| 该商品已扫齐 | Item complete | 单SKU扫描完成 |
| 整单已扫齐 | All items complete | 整单扫描完成 |
| 该商品不在本单 | Item not in this order | 扫到不属于当前任务的条码 |
| 数量已超，请勿多扫 | Over quantity | 重复扫/超扫 |
| 网络异常，请重试 | Network error, retry | 在线校验失败 |
| 提交成功 | Submitted | 核销/提交成功 |
| 提交失败 | Submit failed | 核销/提交失败 |

## 打包复核专属（Packing Check）

| 中文 | English | 场景 |
| ---- | ---- | ---- |
| 复核完成，可以打包 | Ready to pack | 复核全部通过 |
| 该商品数量已超，请检查 | Over quantity, check item | 复核发现该商品扫多 |

## 条码绑定专属（Barcode Binding）

| 中文 | English | 场景 |
| ---- | ---- | ---- |
| 完成绑定 | Binding complete | 绑定成功 |
| 条码已被其他商品绑定 | Barcode already in use | 条码冲突 |

## 注意事项

- 「数量已超，请勿多扫」（Over quantity）与「该商品数量已超，请检查」（Over quantity, check item）发音相近：一个提醒别再扫，一个要求检查取出，建议配不同警示音；若场景不冲突可合并为一条。
- 术语统一：文档与提示语统一使用「备货」，不使用「揽货」（见 APP端页面原型说明）。
