import { Entry } from '../types/entry';
interface EntryListProps {
    accountings: Entry[];
    // onDelete: (index: number) => void;
    onDelete: (id: string) => void;
}

export default function EntryList({ accountings, onDelete }: EntryListProps) {

    if (!accountings) return <div>資料載入中...</div>; 

    return (
        <div>
            {accountings.map((accounting, index) => (
                <div key={index} className="flex justify-between items-center mb-2 p-2  rounded">
                    <span className={`font-bold text-xl ${accounting.type === '支出' ? 'text-red-500' : 'text-green-500'}`}>
                        {accounting.type === '支出' ? '-' : '+'}{accounting.amount}
                    </span>
                    <span className="mr-4 text-white">{accounting.description}</span>
                    <button onClick={() => onDelete(accounting.id)} className="bg-red-400 text-white hover:bg-red-500 px-4 py-1.5 rounded">刪除</button>
                </div>
            ))}
        </div>
    );
}