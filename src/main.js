/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const discount = 1 - purchase.discount / 100;
  return purchase.sale_price * purchase.quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;

  if (index === 0) {
    return profit * 0.15;
  } else if (index === 1 || index === 2) {
    return profit * 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    // Для всех остальных
    return profit * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (!data || !Array.isArray(data.sellers) || data.sellers.length === 0) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций
  if (
    !options ||
    typeof options.calculateRevenue !== "function" ||
    typeof options.calculateBonus !== "function"
  ) {
    throw new Error(
      "Некорректные или отсутствующие опции: calculateRevenue и/или calculateBonus"
    );
  }
  const { calculateRevenue, calculateBonus } = options;

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = sellerStats.reduce(
    (result, item) => ({
      ...result,
      [item.id]: item,
    }),
    {}
  ); // Ключом будет id, значением — запись из sellerStats

  const productIndex = data.products.reduce(
    (result, item) => ({
      ...result,
      [item.sku]: item,
    }),
    {}
  ); // Ключом будет sku, значением — запись из data.products

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    seller.sales_count += 1;
    seller.revenue += record.total_amount;

    record.items.forEach((item) => {
      const product = productIndex[item.sku]; // Товар
      const cost = product.purchase_price * item.quantity;
      const revenue = calculateRevenue(item);
      const profit = revenue - cost;
      seller.profit += profit;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += 1;
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);
    // seller.top_products = // Формируем топ-10 товаров
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 10);    
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
})); 
}
