#!/usr/bin/env python3
# 🧮 CALCULADORA DE INGRESOS BOSTON TRACKER SaaS 2025

import datetime

# Configuración
USD_TO_ARS = 1300  # Tipo de cambio proyectado
PLANES = {
    'basico': {'usd': 49, 'ars': 51000, 'limite': 3},
    'pro': {'usd': 99, 'ars': 103000, 'limite': 10},
    'enterprise': {'usd': 199, 'ars': 207000, 'limite': 999}
}

def calcular_ingresos_mensuales(clientes_basico, clientes_pro, clientes_enterprise):
    """Calcula ingresos mensuales según cantidad de clientes por plan"""
    
    ingresos_basico = clientes_basico * PLANES['basico']['ars']
    ingresos_pro = clientes_pro * PLANES['pro']['ars'] 
    ingresos_enterprise = clientes_enterprise * PLANES['enterprise']['ars']
    
    total_ars = ingresos_basico + ingresos_pro + ingresos_enterprise
    total_clientes = clientes_basico + clientes_pro + clientes_enterprise
    
    return {
        'basico': {'clientes': clientes_basico, 'ingresos': ingresos_basico},
        'pro': {'clientes': clientes_pro, 'ingresos': ingresos_pro},
        'enterprise': {'clientes': clientes_enterprise, 'ingresos': ingresos_enterprise},
        'total_ars': total_ars,
        'total_usd': total_ars / USD_TO_ARS,
        'total_clientes': total_clientes,
        'precio_promedio_ars': total_ars / total_clientes if total_clientes > 0 else 0
    }

def proyeccion_2025():
    """Proyección realista para cada mes de 2025"""
    
    # Distribución típica: 40% básico, 50% pro, 10% enterprise
    escenarios = {
        'ene': (1, 1, 0),    # 2 clientes total
        'feb': (2, 2, 0),    # 4 clientes total  
        'mar': (3, 4, 0),    # 7 clientes total
        'abr': (5, 6, 1),    # 12 clientes total
        'may': (7, 9, 2),    # 18 clientes total
        'jun': (10, 13, 2),  # 25 clientes total
        'jul': (14, 18, 3),  # 35 clientes total
        'ago': (18, 23, 4),  # 45 clientes total
        'sep': (22, 28, 5),  # 55 clientes total
        'oct': (28, 35, 7),  # 70 clientes total
        'nov': (34, 43, 8),  # 85 clientes total
        'dic': (40, 50, 10)  # 100 clientes total
    }
    
    print("🚀 PROYECCIÓN DE INGRESOS 2025 - BOSTON TRACKER SaaS")
    print("=" * 65)
    print(f"{'MES':<4} {'CLIENTES':<10} {'BÁSICO':<12} {'PRO':<12} {'ENTERPRISE':<12} {'TOTAL ARS':<15}")
    print("-" * 65)
    
    total_anual = 0
    
    for mes, (basico, pro, enterprise) in escenarios.items():
        resultado = calcular_ingresos_mensuales(basico, pro, enterprise)
        total_anual += resultado['total_ars']
        
        print(f"{mes.upper():<4} {resultado['total_clientes']:<10} "
              f"${resultado['basico']['ingresos']:,}".replace(',', '.')[:-3] + "K"
              f" ${resultado['pro']['ingresos']:,}".replace(',', '.')[:-3] + "K"
              f" ${resultado['enterprise']['ingresos']:,}".replace(',', '.')[:-3] + "K"
              f" ${resultado['total_ars']:,}".replace(',', '.'))
    
    print("=" * 65)
    print(f"💰 TOTAL ANUAL 2025: ${total_anual:,} ARS".replace(',', '.'))
    print(f"💰 PROMEDIO MENSUAL: ${total_anual/12:,.0f} ARS".replace(',', '.'))
    print(f"💵 EQUIVALENTE USD: ${total_anual/USD_TO_ARS:,.0f} USD".replace(',', '.'))

if __name__ == "__main__":
    proyeccion_2025()
    
    print("\n" + "=" * 50)
    print("🧮 CALCULADORA PERSONALIZADA")
    print("=" * 50)
    
    try:
        print("Ingresa la cantidad de clientes por plan:")
        basico = int(input("Clientes Plan Básico (ARS $51K): "))
        pro = int(input("Clientes Plan Pro (ARS $103K): "))  
        enterprise = int(input("Clientes Plan Enterprise (ARS $207K): "))
        
        resultado = calcular_ingresos_mensuales(basico, pro, enterprise)
        
        print(f"\n💰 RESULTADOS PERSONALIZADOS:")
        print(f"   Total clientes: {resultado['total_clientes']}")
        print(f"   Ingresos mensuales: ${resultado['total_ars']:,} ARS".replace(',', '.'))
        print(f"   Ingresos anuales: ${resultado['total_ars']*12:,} ARS".replace(',', '.'))
        print(f"   Equivalente USD: ${resultado['total_usd']:,.0f} USD/mes".replace(',', '.'))
        
    except:
        print("🎯 Usa la proyección estándar mostrada arriba")
