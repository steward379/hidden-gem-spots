import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// components
import Form from '../../components/Form'
import { Entry } from '../../types/entry';
import EntryList from '../../components/EntryList'
import Link from 'next/link';

import firebaseServices from '../../utils/firebase';
const { db, auth } = firebaseServices;

import { collection, getDocs, addDoc, deleteDoc, doc, query, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";

export default function Accounting() {
    const [accountings, setAccountings] = useState<Entry[]>([]);
    const [uid, setUid] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid);
            } else {
                setUid(null);

                router.push({
                    pathname: "/",
                    query: { message: "請先登入" },
                })
            }
        });
        
        return () => unsubscribe();;
    }, [router]);

    useEffect(() => {
        if(!uid) return;

        const fetchData = async () => {
            const q = query(collection(db, `users/${uid}/accountings`));
            const querySnapshot = await getDocs(q);
            setAccountings(querySnapshot.docs.map
                            (doc => ({ id: doc.id, ...doc.data() } as Entry)));
        };

        fetchData();
        
    }, [uid]);

    const handleNewAccounting = async (accounting: Entry) => {
        if(!uid) return;

        const docRef = await addDoc(collection(db, `users/${uid}/accountings`), accounting);
        setAccountings([...accountings, { id: docRef.id, ...accounting }]);
    };

    const handleDeleteAccounting = async (id: string) => {
        if(!uid) return;

        await deleteDoc(doc(db, `users/${uid}/accountings`, id));
        setAccountings(accountings.filter(accounting => accounting.id !== id));
      };

    const total = accountings.reduce((sum, accounting) => accounting.type === '收入' ? sum + accounting.amount : sum - accounting.amount, 0);

    return (
        <div className="container max-w-xl mx-auto border p-10 mt-10">
            <h2 className="text-2xl font-bold mb-4">記帳本</h2>
            <Form onAdd={handleNewAccounting} />
            <EntryList accountings={accountings} onDelete={handleDeleteAccounting} />
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