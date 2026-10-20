import { redirect } from "next/navigation";

export default function MyBillsRedirect() {
  redirect("/owner/bills");
}
