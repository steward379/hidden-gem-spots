import { SignUp } from "@clerk/nextjs";
 
export default function Page() {
  return ( 
  <div className="flex justify-center align-center mt-28">
    <SignUp />
  </div>
  )
}