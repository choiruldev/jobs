/**
 * In-Browser Technical Interview Coding Sandbox & Test Runner
 * Evaluates candidate code solutions against real-time assertion test suites.
 */

export const CODING_CHALLENGES = [
  {
    id: "debounce",
    title: "1. Implementasikan Fungsi Debounce",
    difficulty: "Medium",
    category: "Frontend & Utilities",
    description: "Buat fungsi `debounce(fn, delay)` yang menunda eksekusi fungsi `fn` hingga `delay` milidetik berlalu sejak pemanggilan terakhir.",
    starterCode: `function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}`,
    testRunner: async (userCode) => {
      const results = [];
      try {
        const factory = new Function(`${userCode}; return debounce;`);
        const debounce = factory();

        // Test 1: Function delayed
        let count = 0;
        const debounced = debounce(() => { count++; }, 50);
        debounced();
        debounced();
        debounced();
        if (count !== 0) throw new Error("Fungsi dieksekusi terlalu cepat sebelum delay selesai.");
        
        await new Promise(r => setTimeout(r, 80));
        if (count !== 1) throw new Error(`Ekspektasi dipanggil 1 kali, tapi dipanggil ${count} kali.`);
        results.push({ name: "Test 1: Membatalkan panggilan berulang dan hanya mengeksekusi 1 kali", passed: true });

        // Test 2: Passing arguments
        let lastArg = "";
        const debouncedArg = debounce((val) => { lastArg = val; }, 30);
        debouncedArg("Halo");
        debouncedArg("Dunia");
        await new Promise(r => setTimeout(r, 60));
        if (lastArg !== "Dunia") throw new Error(`Argumen terakhir tidak sesuai. Didapat: ${lastArg}`);
        results.push({ name: "Test 2: Meneruskan argumen terakhir secara akurat", passed: true });

      } catch (err) {
        results.push({ name: "Eksekusi Uji", passed: false, error: err.message });
      }
      return results;
    }
  },
  {
    id: "flatten",
    title: "2. Deep Array Flatten (Tanpa Array.flat)",
    difficulty: "Easy",
    category: "Algoritma & Rekursi",
    description: "Buat fungsi `flatten(arr)` yang meratakan array bersarang (nested) ke kedalaman apa pun menjadi 1 dimensi tanpa menggunakan `Array.prototype.flat()` bawaan.",
    starterCode: `function flatten(arr) {
  const result = [];
  function helper(sub) {
    for (const item of sub) {
      if (Array.isArray(item)) {
        helper(item);
      } else {
        result.push(item);
      }
    }
  }
  helper(arr);
  return result;
}`,
    testRunner: async (userCode) => {
      const results = [];
      try {
        const factory = new Function(`${userCode}; return flatten;`);
        const flatten = factory();

        const input1 = [1, [2, [3, [4]], 5]];
        const out1 = flatten(input1);
        if (JSON.stringify(out1) !== JSON.stringify([1, 2, 3, 4, 5])) {
          throw new Error(`Gagal pada nested 4 tingkat. Hasil: ${JSON.stringify(out1)}`);
        }
        results.push({ name: "Test 1: Meratakan array bertingkat [1, [2, [3, [4]], 5]]", passed: true });

        const input2 = [[], [1], [[2, 3]]];
        const out2 = flatten(input2);
        if (JSON.stringify(out2) !== JSON.stringify([1, 2, 3])) {
          throw new Error(`Gagal pada array kosong. Hasil: ${JSON.stringify(out2)}`);
        }
        results.push({ name: "Test 2: Menangani array kosong dan elemen acak", passed: true });
      } catch (err) {
        results.push({ name: "Eksekusi Uji", passed: false, error: err.message });
      }
      return results;
    }
  },
  {
    id: "lru_cache",
    title: "3. Least Recently Used (LRU) Cache",
    difficulty: "Hard",
    category: "Struktur Data & Sistem",
    description: "Implementasikan class `LRUCache(capacity)` dengan metode `get(key)` dan `put(key, value)`. Jika kapasitas melebihi batas, hapus item yang paling jarang digunakan (least recently used).",
    starterCode: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}`,
    testRunner: async (userCode) => {
      const results = [];
      try {
        const factory = new Function(`${userCode}; return LRUCache;`);
        const LRUCache = factory();

        const lru = new LRUCache(2);
        lru.put(1, 1);
        lru.put(2, 2);
        if (lru.get(1) !== 1) throw new Error("Key 1 tidak ditemukan");
        lru.put(3, 3); // Harus mengeluarkan key 2 (karena key 1 baru saja di-get)
        if (lru.get(2) !== -1) throw new Error("Key 2 seharusnya sudah dikeluarkan (evicted) oleh LRU");
        results.push({ name: "Test 1: Operasi dasar LRU put, get, dan eviction", passed: true });

        lru.put(4, 4); // Harus mengeluarkan key 1 (karena key 3 baru saja di-put)
        if (lru.get(1) !== -1) throw new Error("Key 1 seharusnya sudah dikeluarkan");
        if (lru.get(3) !== 3) throw new Error("Key 3 seharusnya tetap ada");
        if (lru.get(4) !== 4) throw new Error("Key 4 seharusnya tetap ada");
        results.push({ name: "Test 2: Pembaruan urutan penggunaan setelah get()", passed: true });
      } catch (err) {
        results.push({ name: "Eksekusi Uji", passed: false, error: err.message });
      }
      return results;
    }
  }
];
