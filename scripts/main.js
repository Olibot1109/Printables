const defaultMenu = [
];

const typingSpeed = 25;
const ordersPath = 'orders.json';
let menuList;

const formatPrice = (price) => (price >= 1 ? `£${price.toFixed(2)}` : `${Math.round(price * 100)}p`);

const createOrderMap = (data) => {
  const map = new Map();
  if (!data) {
    return map;
  }

  if (Array.isArray(data)) {
    data.forEach((entry) => {
      if (!entry) return;
      const itemName = entry.name || entry.item;
      if (!itemName) return;
      const rawCount = entry.count ?? entry.orders ?? entry.qty ?? entry.quantity;
      const parsed = typeof rawCount === 'number' ? rawCount : Number(rawCount);
      map.set(itemName, Number.isFinite(parsed) ? parsed : 0);
    });
  } else if (typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      const parsed = typeof value === 'number' ? value : Number(value);
      map.set(key, Number.isFinite(parsed) ? parsed : 0);
    });
  }

  return map;
};

const renderMenu = (items, orderMap = new Map()) => {
  if (!menuList) return;
  menuList.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'menu-item';

    const icon = document.createElement('img');
    icon.className = 'menu-icon';
    icon.src = item.icon;
    icon.alt = `${item.name} icon`;

    const info = document.createElement('div');
    info.className = 'menu-info';

    const name = document.createElement('strong');
    name.textContent = item.name;

    const price = document.createElement('span');
    price.className = 'menu-price';
    price.textContent = formatPrice(item.price);

    const count = orderMap.get(item.name) ?? 0;
    const orderCount = document.createElement('span');
    orderCount.className = 'order-count';
    orderCount.textContent = `Orders: ${count}`;

    info.append(name, price, orderCount);
    li.append(icon, info);
    menuList.appendChild(li);

  });
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const typeLetters = (node, text, speed) =>
  new Promise((resolve) => {
    let index = 0;
    const timer = setInterval(() => {
      node.textContent += text[index] ?? '';
      index += 1;
      if (index >= text.length) {
        clearInterval(timer);
        resolve();
      }
    }, speed);
  });

const gatherTextNodes = (root = document.body) => {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        const tag = node.parentElement.tagName;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  return nodes;
};

const applyTypewriter = async () => {
  const nodes = gatherTextNodes();

  const animations = nodes.map((node) => {
    const text = node.textContent;
    if (!text) {
      return Promise.resolve();
    }

    node.textContent = '';
    return typeLetters(node, text, typingSpeed);
  });

  await Promise.all(animations);
};

const loadOrders = async () => {
  try {
    const response = await fetch(ordersPath);
    if (!response.ok) {
      throw new Error(`Unable to load ${ordersPath}`);
    }
    const data = await response.json();
    return createOrderMap(data);
  } catch (error) {
    console.warn(error.message);
    return new Map();
  }
};

const initMenu = async () => {
  let items = defaultMenu;
  try {
    const response = await fetch('items.json');
    if (!response.ok) {
      throw new Error('Unable to load items.json');
    }
    const fetched = await response.json();
    if (Array.isArray(fetched) && fetched.length) {
      items = fetched;
    }
  } catch (error) {
    console.warn(error.message);
  }

  const orderMap = await loadOrders();
  renderMenu(items, orderMap);
  await applyTypewriter();
};

window.addEventListener('DOMContentLoaded', () => {
  menuList = document.getElementById('menuList');
  if (!menuList) return;

  renderMenu(defaultMenu);
  initMenu();
});
