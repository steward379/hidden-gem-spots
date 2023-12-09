import { SignUp } from "@clerk/nextjs";
 
export default function Page() {
  return ( 
  <div className="flex justify-center align-center mt-28  h-screen-without-navbar">
    <SignUp />
  </div>
  )
}