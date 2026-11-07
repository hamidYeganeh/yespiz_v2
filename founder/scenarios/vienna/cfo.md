# Unit economics: yespiz · سناریوی آموزشی وین

این خروجی بر اساس ورودی‌های فرضی `numbers.json` محاسبه شده است. اعداد به یورو هستند. «Price» در این گزارش درآمد کمیسیون yespiz به ازای هر سفارش است. حاشیه و نیاز نقد فقط هزینه‌های واردشده را پوشش می‌دهند. [منابع و فرض‌ها](../../cfo-sources.md)

## One order

| line | per order |
| --- | ---: |
| Price | €5.00 |
| کارمزد پرداخت آنلاین با ترکیب فرضی | -€0.58 |
| تطبیق نقدی | -€0.08 |
| پشتیبانی متغیر | -€0.50 |
| مسیر، نشانی و پیام | -€0.12 |
| سهم پلتفرم در خطا و جبران | -€0.30 |
| یارانهٔ ارسال پلتفرم | -€0.40 |
| ذخیرهٔ هزینهٔ اضافی تسویه و پرداخت | -€0.22 |
| **Contribution** (what each order leaves to pay the fixed costs) | **€2.80** (56%) |

## The margin that matters

Fixed costs: €3,500 a month (پشتیبانی شیفت و ادارهٔ عملیات €2,400, فناوری و ابزار ثابت €450, جذب و پایش رستوران €350, حسابداری و بیمه €300).

- **Break-even: 42 orders a day.** Below that you lose money every month.
- **Operating margin in this scenario** (55 orders a day): **14%** of platform commission revenue after the modeled costs.

## Year 1, month by month

| month | orders a day | revenue | profit | cumulative (after €7,000 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 8 | €1,200 | -€2,828 | -€9,828 |
| 2 | 12 | €1,800 | -€2,492 | -€12,320 |
| 3 | 17 | €2,550 | -€2,072 | -€14,392 |
| 4 | 22 | €3,300 | -€1,652 | -€16,044 |
| 5 | 28 | €4,200 | -€1,148 | -€17,192 |
| 6 | 34 | €5,100 | -€644 | -€17,836 |
| 7 | 40 | €6,000 | -€140 | -€17,976 |
| 8 | 45 | €6,750 | €280 | -€17,696 |
| 9 | 50 | €7,500 | €700 | -€16,996 |
| 10 | 55 | €8,250 | €1,120 | -€15,876 |
| 11 | 55 | €8,250 | €1,120 | -€14,756 |
| 12 | 55 | €8,250 | €1,120 | -€13,636 |

- **Year 1 operating profit: -€6,636** on €63,150 of revenue.
- After the €7,000 startup spend: -€13,636.
- Startup money earned back: not within year 1.
- Cash you need before it pays for itself: **€17,976**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 14% | 42 | -€6,636 |
| Price -10% | 4% | 51 | -€12,951 |
| Volume -20% | 3% | 42 | -€13,709 |
| Unit costs +15% | 7% | 48 | -€10,804 |

## Red flags

- Year 1 loses money on operations (-€6,636).
- The startup spend is not earned back within year 1.
