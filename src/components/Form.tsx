import { useState } from 'react';
import { Entry } from '../types/entry';

interface Props {
    onAdd: (entry: Entry) => void;
}

export default function Form({ onAdd }: Props) {
    const [type, setType] = useState<'收入' | '支出'>('收入');
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState<string>('');    

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onAdd({ type, description, amount: parseFloat(amount) });
        setDescription('');
        setAmount('');
    };

    return (
        <form onSubmit={handleSubmit} className="mb-4">
            <select title="income-or-cost" 
                    value={type} onChange={(e) => setType(e.target.value as "收入" | "支出")}
                    className={`border p-2 mr-2 text-white ${type === "收入" ? "bg-green-500" : "bg-red-500"}`}
            >
                <option value="收入">收入</option>
                <option value="支出">支出</option>
            </select>
            <input 
                type="text"
                placeholder="描述"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border border-white text-white bg-black focus:bg-transparent placeholder-gray p-2 mr-2"
            />
            <input 
                type="number"
                placeholder="金額"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border border-white text-white bg-black focus:bg-transparent placeholder-gray p-2 mr-2"
            />
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 mt-4 rounded">新增記錄</button>
        </form>
    );
}
