import { db } from "@/lib/db/mongodb";
import type { BookDocument, Book } from "./models/Book";
import { ObjectId } from "mongodb";

export async function createBook(book: Omit<BookDocument, "_id">) {
    return await db.insertOne<any>("books", book);
}

export async function getBooksByWorkspace(workspaceId: string) {
    return await db.find<BookDocument>("books", { workspaceId });
}

export async function getBookById(id: string) {
    return await db.findOne<BookDocument>("books", { _id: new ObjectId(id) });
}

export async function updateBook(id: string, updates: Partial<BookDocument>) {
    await db.updateOne("books", { _id: new ObjectId(id) }, { $set: updates });
}

export async function deleteBook(id: string) {
    await db.deleteOne("books", { _id: new ObjectId(id) });
}
