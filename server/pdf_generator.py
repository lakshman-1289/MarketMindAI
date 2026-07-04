from fpdf import FPDF
import io

class MarketReportPDF(FPDF):
    def header(self):
        # Logo or Title
        self.set_font('Helvetica', 'B', 20)
        self.set_text_color(0, 128, 128) # Teal color
        self.cell(0, 10, 'Brand Buster Analysis', align='C')
        self.ln(5)
        
        self.set_font('Helvetica', 'I', 10)
        self.set_text_color(128, 128, 128) # Grey
        self.cell(0, 10, 'Agentic Competitive Intelligence', align='C')
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')

    def chapter_title(self, title):
        self.set_font('Helvetica', 'B', 14)
        self.set_text_color(0, 0, 0)
        self.cell(0, 10, title, ln=True)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(5)

    def chapter_body(self, body):
        self.set_font('Helvetica', '', 11)
        self.multi_cell(0, 6, body)
        self.ln()

def generate_report_pdf(report: dict) -> bytes:
    pdf = MarketReportPDF()
    pdf.add_page()
    
    # 1. Title & Category
    pdf.set_font('Helvetica', 'B', 16)
    pdf.cell(0, 10, f"Report for: {report.get('product_category', 'Unknown')}", ln=True, align='L')
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(0, 10, f"Generated: {report.get('created_at', 'Unknown')}", ln=True, align='L')
    pdf.ln(10)
    
    # 2. Winning Strategy
    pdf.chapter_title("Winning Strategy")
    strategy = report.get('winning_strategy', 'No strategy available.')
    pdf.set_font('Helvetica', 'I', 12)
    # Add a light background for strategy
    pdf.set_fill_color(240, 248, 255) # AliceBlue
    pdf.multi_cell(0, 8, strategy, fill=True)
    pdf.ln(10)
    
    # 3. Market Pricing Analysis
    pdf.chapter_title("Price Analysis")
    price_data = report.get('price_analysis', [])
    if price_data:
        # Table Header
        pdf.set_font('Helvetica', 'B', 10)
        pdf.set_fill_color(200, 220, 220)
        pdf.cell(60, 8, "Product/Brand", 1, 0, 'C', fill=True)
        pdf.cell(30, 8, "Price", 1, 0, 'C', fill=True)
        pdf.cell(100, 8, "Source", 1, 1, 'C', fill=True)
        
        # Table Rows
        pdf.set_font('Helvetica', '', 9)
        for item in price_data:
            # Handle potentially long names
            brand = item.get('brand_name', 'N/A')
            price = f"${item.get('price', 0)}"
            url = item.get('source_url', 'N/A')
            
            # Simple truncation for PDF safety
            brand = (brand[:25] + '..') if len(brand) > 25 else brand
            url = (url[:50] + '..') if len(url) > 50 else url
            
            pdf.cell(60, 8, brand, 1)
            pdf.cell(30, 8, price, 1)
            pdf.cell(100, 8, url, 1, 1)
    else:
        pdf.chapter_body("No pricing data available.")
    pdf.ln(10)

    # 4. Sentiment Analysis
    pdf.chapter_title("Sentiment Analysis")
    sentiment_data = report.get('sentiment_analysis', [])
    if sentiment_data:
        for item in sentiment_data:
            theme = item.get('theme', 'N/A')
            desc = item.get('description', 'N/A')
            impact = item.get('impact_level', 'N/A')
            
            # Color code impact
            impact_color = " [!]" if impact.lower() == 'high' else ""
            
            pdf.set_font('Helvetica', 'B', 10)
            pdf.cell(0, 6, f"- {theme} ({impact}{impact_color})", ln=True)
            pdf.set_font('Helvetica', '', 10)
            pdf.multi_cell(0, 6, f"  {desc}")
            pdf.ln(2)
    else:
        pdf.chapter_body("No sentiment data available.")
    pdf.ln(10)
    
    # 5. Competitors
    pdf.chapter_title("Competitors")
    competitors = report.get('competitors', [])
    if competitors:
        comp_str = ", ".join(competitors)
        pdf.chapter_body(comp_str)
    else:
        pdf.chapter_body("No competitors listed.")
        
    # Return PDF bytes
    # fpdf2 .output() without args returns bytearray
    return bytes(pdf.output())
