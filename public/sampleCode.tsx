// { hideRoutingMode ? (
//     <i className={`cursor-pointer hover:text-green-600 absolute left-0 top-[100px] fas fa-route rounded-full p-1 text-xl text-black-600`}
//         onClick={ showIsRoutingMode }
//     ></i>
//   ):(
// <div className="inline-block">
//   <button title="route-mode"
//           className={`justify-center items-center relative`}> 
//     <button
//         className=" p-3 lg:h-20 text-sm
//               font-medium hover:bg-black bg-green-200 hover:text-green-500 rounded-full"
//         onClick={() => setIsRoutingMode(!isRoutingMode)}>
//       <div>
//       {isRoutingMode ?  <i className="fas fa-door-open"></i> :  <i className="fas fa-route"></i>}   
//       </div>
//       <div className="hidden lg:inline">
//           {isRoutingMode ? "停止路徑" : "規劃路徑"}
//       </div>
//     </button>
//   </button>
// </div>
// )}