import { db } from '../firebaseAdmin'; // 引入您初始化的 Firebase Admin

export async function getServerSideProps(context) {
  const page = parseInt(context.query.page) || 1;
  const limit = parseInt(context.query.limit) || 4;
  const skip = (page - 1) * limit;

  let maps = [];
  let totalDocs;

  try {
    // 獲取總文檔數量
    totalDocs = (await db.collectionGroup('maps').get()).size;

    // 查詢當前頁面的數據
    const snapshot = await db.collectionGroup('maps')
      .orderBy('publishDate', 'desc')
      .offset(skip)
      .limit(limit)
      .get();
    
    maps = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching maps', error);
  }

  return {
    props: {
      maps,
      totalPages: Math.ceil(totalDocs / limit),
      currentPage: page,
    },
  };
}
