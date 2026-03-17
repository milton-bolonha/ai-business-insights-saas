import React, { useMemo } from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register standard fonts required for the book using local paths

Font.register({
    family: 'Montserrat',
    fonts: [
        { src: '/fonts/Montserrat-Regular.ttf', fontWeight: 400 },
        { src: '/fonts/Montserrat-Bold.ttf', fontWeight: 700 }
    ]
});

Font.register({
    family: 'Palatino',
    fonts: [
        { src: '/fonts/Palatino.ttf', fontWeight: 400 }
    ]
});

Font.register({
    family: 'Oswald',
    fonts: [
        { src: '/fonts/Oswald-Bold.otf', fontWeight: 700 }
    ]
});

// A5 Dimensions in PostScript points: 420 x 595 (approx)
// We will use standard A5 and apply the required paddings.
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        paddingTop: 56,     // 20mm
        paddingBottom: 72,  // Increased to 25mm to avoid overlap
        paddingLeft: 48,
        paddingRight: 48,
        fontFamily: 'Montserrat',
    },
    titlePage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    titlePageContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainTitle: {
        fontFamily: 'Oswald',
        fontWeight: 700,
        fontSize: 26,
        textAlign: 'center',
        color: '#1a1a1a',
        marginBottom: 24,
    },
    authorName: {
        fontFamily: 'Montserrat',
        fontWeight: 400,
        fontSize: 14,
        textAlign: 'center',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    publisherName: {
        fontFamily: 'Montserrat',
        fontWeight: 400,
        fontSize: 10,
        textAlign: 'center',
        color: '#4b5563',
        position: 'absolute',
        bottom: 56,
        left: 0,
        right: 0,
    },
    copyrightPage: {
        justifyContent: 'flex-end',
        paddingBottom: 56,
    },
    copyrightContainer: {
        flexDirection: 'column',
    },
    copyrightTitle: {
        fontFamily: 'Oswald',
        fontWeight: 700,
        fontSize: 10,
        color: '#1a1a1a',
        marginBottom: 8,
    },
    copyrightText: {
        fontFamily: 'Montserrat',
        fontWeight: 400,
        fontSize: 9,
        lineHeight: 1.4,
        color: '#1a1a1a',
        marginBottom: 4,
    },
    titleText: {
        fontFamily: 'Oswald',
        fontWeight: 700,
        fontSize: 18,
        lineHeight: 1.3,
        textAlign: 'center',
        color: '#1a1a1a',
        marginTop: 32,
        marginBottom: 24,
        letterSpacing: 1,
    },
    paragraphText: {
        fontFamily: 'Palatino',
        fontWeight: 400,
        fontSize: 12,
        lineHeight: 1.4,
        color: '#1a1a1a',
        textAlign: 'justify',
        marginBottom: 12,
    },
    indentedParagraphText: {
        fontFamily: 'Palatino',
        fontWeight: 400,
        fontSize: 12,
        lineHeight: 1.4,
        color: '#1a1a1a',
        textAlign: 'justify',
        marginBottom: 12,
        textIndent: 24, 
    },
    pageNumber: {
        position: 'absolute',
        fontSize: 9,
        bottom: 40, // Lowered page number
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#9ca3af',
    }
});

interface BookPDFDocumentProps {
    title: string;
    contentHTML: string;
    names?: string[];
}

// A rugged parser to convert the incoming HTML string into React-PDF primitives
const parseHTMLContent = (htmlString: string) => {
    // 1. Remove newlines and trim to prevent empty text nodes
    const cleanHTML = htmlString.replace(/\n/g, '').replace(/<\//g, '</').trim();

    // 2. Simple regex based parser to find h2 and p tags sequentially
    const elements: { type: 'h2' | 'p', content: string }[] = [];

    // We will extract inner text of tags. 
    // This regex looks for <h2>...</h2> or <p>...</p> 
    // Uses global and single-line/dot-all flags if necessary but since we removed newlines, standard is fine.
    const tagRegex = /<(h2|p)[^>]*>(.*?)<\/\1>/gi;

    let match;
    while ((match = tagRegex.exec(cleanHTML)) !== null) {
        const type = match[1].toLowerCase() as 'h2' | 'p';
        // Remove nested tags (like <br> or <strong>) if AI outputted them by mistake
        // react-pdf Text primitive only expects raw strings
        const content = match[2].replace(/<[^>]+>/g, '').trim();

        if (content) {
            elements.push({ type, content });
        }
    }

    return elements;
};

export const BookPDFDocument = ({ title, contentHTML, names = [] }: BookPDFDocumentProps) => {

    const elements = useMemo(() => parseHTMLContent(contentHTML), [contentHTML]);

    return (
        <Document title={title} author="Love Writers" creator="Love Writers System">
            {/* Front matter: Title Page */}
            <Page size="A5" style={[styles.page, styles.titlePage]}>
                <View style={styles.titlePageContent}>
                    <Text style={styles.mainTitle}>{title}</Text>
                    <Text style={styles.authorName}>Autores Apaixonados</Text>
                    {names.map((name, idx) => (
                        <Text key={`name-${idx}`} style={styles.authorName}>{name}</Text>
                    ))}
                </View>
                <Text style={styles.publisherName}>Editora Autores Apaixonados 2026</Text>
            </Page>

            {/* Front matter: Copyright Page */}
            <Page size="A5" style={[styles.page, styles.copyrightPage]}>
                <View style={styles.copyrightContainer}>
                    <Text style={styles.copyrightTitle}>{title}</Text>
                    <Text style={styles.copyrightText}>por {names.join(", ")} {names.length > 0 ? "e " : ""}Autores Apaixonados</Text>
                    <Text style={styles.copyrightText}>Publicado por Editora Autores Apaixonados</Text>
                    <Text style={styles.copyrightText}>Ribeirão Preto – SP</Text>
                    <Text style={styles.copyrightText}>Copyright © 2026 Autores Apaixonados</Text>
                    <Text style={styles.copyrightText}> </Text>
                    <Text style={styles.copyrightText}>
                        Todos os direitos reservados. Este livro não deve ser reproduzido sem a permissão do autor, nem partes e nem na íntegra, exceto por formas previstas no ordenamento jurídico Brasileiro. Para permissões de uso contate: ola@autoresapaixonados.com
                    </Text>
                    <Text style={styles.copyrightText}> </Text>
                    <Text style={styles.copyrightText}>Capa por Autores Apaixonados</Text>
                    <Text style={styles.copyrightText}>Impresso no Brasil</Text>
                </View>
            </Page>

            {/* Main Content */}
            <Page size="A5" style={styles.page} wrap={true}>
                {elements.map((el, index) => {
                    if (el.type === 'h2') {
                        return (
                            <Text key={`h2-${index}`} style={styles.titleText}>
                                {el.content}
                            </Text>
                        );
                    } else {
                        // Determine if we need an indent. 
                        // First paragraph after title, or first overall, gets indent
                        const isFirstOrAfterTitle = index === 0 || elements[index - 1]?.type === 'h2';
                        return (
                            <Text key={`p-${index}`} style={isFirstOrAfterTitle ? styles.indentedParagraphText : styles.paragraphText}>
                                {el.content}
                            </Text>
                        );
                    }
                })}

                {/* React-PDF natively supports page numbers using the render prop pattern */}
                <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
                    `${pageNumber - 2} / ${totalPages - 2}`
                )} fixed />
            </Page>
        </Document>
    );
};
