
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const sectors = [
  { name: "Tech", value: 17.5 },
  { name: "Energy", value: 15.0 },
  { name: "Lumber", value: 10.0 },
  { name: "Mining", value: 15.0 },
  { name: "Auto", value: 15.0 },
  { name: "S&P 500", value: 15.0 },
  { name: "All-World", value: 5.0 },
  { name: "Emerging", value: 5.0 },
];

const tickers = ["AAPL", "MSFT", "TSLA", "VOO", "GLEN.L", "RIO", "BHP"];

const growthData = Array.from({ length: 12 }, (_, i) => ({
  month: `Month ${i + 1}`,
  "$500": 500 * ((i * (i + 1)) / 2) * 1.01,
  "$1000": 1000 * ((i * (i + 1)) / 2) * 1.01,
}));

export default function GTBDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [amount, setAmount] = useState("$500");
  const [prices, setPrices] = useState({});
  const [dividendYield, setDividendYield] = useState(0.018);
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem("gtb_user_data");
    return saved ? JSON.parse(saved) : { contribution: "$500", simulations: [] };
  });

  useEffect(() => {
    async function fetchPrices() {
      const responses = await Promise.all(
        tickers.map(ticker =>
          fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`)
            .then(res => res.json())
        )
      );

      const updated = {};
      responses.forEach((res, idx) => {
        const quote = res.quoteResponse.result[0];
        if (quote) {
          updated[tickers[idx]] = quote.regularMarketPrice;
        }
      });

      setPrices(updated);
    }

    fetchPrices();
  }, []);

  const portfolioValue = Object.values(prices).reduce((acc, price) => acc + price, 0);
  const estimatedIncome = portfolioValue * dividendYield;

  const handleLogin = () => {
    if (email && password) {
      localStorage.setItem("gtb_user", email);
      setLoggedIn(true);
    }
  };

  const handleContributionChange = (val) => {
    setAmount(val);
    const updated = { ...userData, contribution: val };
    setUserData(updated);
    localStorage.setItem("gtb_user_data", JSON.stringify(updated));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(userData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gtb_simulation.json";
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const data = JSON.parse(reader.result);
      setUserData(data);
      setAmount(data.contribution);
      localStorage.setItem("gtb_user_data", JSON.stringify(data));
    };
    reader.readAsText(file);
  };

  if (!loggedIn) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Login to GTB Simulator</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-4 py-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 px-4 py-2 border rounded"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Global Titan Blend Index (GTB)</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Portfolio Allocation</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sectors}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              {sectors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Real-Time Prices Snapshot</h2>
        <ul className="list-disc list-inside">
          {Object.entries(prices).map(([ticker, price]) => (
            <li key={ticker}>
              <strong>{ticker}</strong>: ${price?.toFixed(2)}
            </li>
          ))}
        </ul>
        <p className="mt-2">Estimated Portfolio Value: <strong>${portfolioValue.toFixed(2)}</strong></p>
        <p>Projected Annual Dividend Income (@{(dividendYield * 100).toFixed(1)}%): <strong>${estimatedIncome.toFixed(2)}</strong></p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Simulated Growth</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => handleContributionChange("$500")}
            className={`px-4 py-2 rounded ${amount === "$500" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            $500/mo
          </button>
          <button
            onClick={() => handleContributionChange("$1000")}
            className={`px-4 py-2 rounded ${amount === "$1000" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            $1000/mo
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 rounded bg-green-600 text-white"
          >
            Export
          </button>
          <input type="file" onChange={importData} className="px-2" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={growthData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={amount}
              stroke="#1d4ed8"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
