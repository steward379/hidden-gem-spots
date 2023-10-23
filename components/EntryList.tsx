import { Entry } from '../types/entry';

interface EntryListProps {
    entries: Entry[];
    onDelete: (index: number) => void;
}

export default function EntryList({ entries, onDelete }: EntryListProps) {
    return (
        <div>
            {entries.map((entry, index) => (
                <div key={index} className="flex justify-between items-center mb-2 p-2  rounded">
                    <span className={`font-bold text-xl ${entry.type === '支出' ? 'text-red-500' : 'text-green-500'}`}>
                        {entry.type === '支出' ? '-' : '+'}{entry.amount}
                    </span>
                    <span className="mr-4 text-white">{entry.description}</span>
                    <button onClick={() => onDelete(index)} className="bg-red-400 text-white hover:bg-red-500 px-4 py-1.5 rounded">刪除</button>
                </div>
            ))}
        </div>
    );
}