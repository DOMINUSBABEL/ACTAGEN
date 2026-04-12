import fitz
import os
import sys
import json
import argparse

def main():
    parser = argparse.ArgumentParser(description="Extract specific pages from a merged PDF into individual Acta PDFs.")
    parser.add_argument("pdf_path", help="Path to the merged PDF file.")
    parser.add_argument("output_dir", help="Base output directory (e.g., FIRMAS SIMI MARIAM).")
    parser.add_argument("mapping", help="JSON string mapping Acta numbers to 0-indexed page numbers (e.g., '{\"309\": 50, \"329\": 32}').")
    
    args = parser.parse_args()
    
    try:
        if os.path.isfile(args.mapping):
            with open(args.mapping, 'r', encoding='utf-8') as f:
                mapping = json.load(f)
        else:
            mapping = json.loads(args.mapping)
    except Exception as e:
        print(f"Error parsing mapping: {e}")
        sys.exit(1)
        
    if not os.path.exists(args.pdf_path):
        print(f"PDF file not found: {args.pdf_path}")
        sys.exit(1)
        
    doc = fitz.open(args.pdf_path)
    
    for acta, page_num in mapping.items():
        page_num = int(page_num)
        acta_dir = os.path.join(args.output_dir, f"ACTA #{acta}")
        
        # Ensure the directory exists
        os.makedirs(acta_dir, exist_ok=True)
        
        new_pdf_path = os.path.join(acta_dir, f"{acta}.pdf")
        
        try:
            new_doc = fitz.open()
            new_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
            new_doc.save(new_pdf_path)
            new_doc.close()
            
            # Remove legacy file if it exists to maintain file ecosystem cleaner
            legacy_file = os.path.join(acta_dir, "documento con la firma del acta.pdf")
            if os.path.exists(legacy_file):
                os.remove(legacy_file)
                print(f"Removed legacy file {legacy_file}")
                
            print(f"Extracted Acta {acta} (Page {page_num}) to {new_pdf_path}")
        except Exception as e:
            print(f"Error extracting Acta {acta}: {e}")

    doc.close()

if __name__ == "__main__":
    main()
