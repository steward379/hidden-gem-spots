import { useState } from 'react';
import Form from '../../components/Form'
import EntryList from '../../components/EntryList'
import Link from 'next/link';
import { Entry } from '../../types/entry';

export default function Accounting() {
    const [entries, setEntries] = useState([]); 

    const handleNewEntry = (entry: Entry) => {
        setEntries([...entries, entry]);
    };

    const handleDelete = (index: number) => {
        const newEntries = [...entries];
        newEntries.splice(index, 1);
        setEntries(newEntries);
    };

    const total = entries.reduce((sum, entry) => entry.type === '收入' ? sum + entry.amount : sum - entry.amount, 0);

    return (
        <div className="container max-w-xl mx-auto border p-10 mt-10">
            <h2 className="text-2xl font-bold mb-4">記帳本</h2>
            <Form onAdd={handleNewEntry} />
            <EntryList entries={entries} onDelete={handleDelete} />
            <hr></hr>
            <div className="mt-4">
                小計: <span className={`font-bold text-2xl ${total < 0 ? 'text-red-500' : 'text-green-500'}`}>{total}</span>
            </div>
            <div className="mt-10">
                <Link href="/" className="bg-gray-500 text-white hover:bg-blue-500 px-4 py-3 rounded">返回首頁</Link>
            </div>
        </div>
    );
}