// import { db } from '../firebaseAdmin'; 

// export async function getServerSideProps(context) {
//   const page = parseInt(context.query.page) || 1;
//   const limit = parseInt(context.query.limit) || 4;
//   const skip = (page - 1) * limit;

//   let maps = [];
//   let totalDocs;

//   try {
//     totalDocs = (await db.collectionGroup('maps').get()).size;

//     const snapshot = await db.collectionGroup('maps')
//       .orderBy('publishDate', 'desc')
//       .offset(skip)
//       .limit(limit)
//       .get();
    
//     maps = snapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data(),
//     }));
//   } catch (error) {
//     console.error('Error fetching maps', error);
//   }

//   return {
//     props: {
//       maps,
//       totalPages: Math.ceil(totalDocs / limit),
//       currentPage: page,
//     },
//   };
// }
