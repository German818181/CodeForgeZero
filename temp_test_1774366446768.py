
logs_crudos = [
    {'timestamp': '2022-01-01', 'source_ip': '192.168.1.1', 'request_payload': 'Hola mundo'},
    {'timestamp': '2022-01-02', 'source_ip': '192.168.1.2', 'request_payload': 'Hola mundo'},
    {'timestamp': '2022-01-03', 'source_ip': '192.168.1.3', 'request_payload': 'Hola mundo'}
]

ips_maliciosas = ['192.168.1.1', '192.168.1.3']
firmas_ataque = ['Hola', 'mundo']

def escanear_logs_nube(logs_crudos, ips_maliciosas, firmas_ataque):
    alertas_criticas = []
    
    for log in logs_crudos:
        es_peligroso = False
        
        for firma in firmas_ataque:
            if firma in log['request_payload']:
                es_peligroso = True
                
        ip_bloqueada = False
        for ip in ips_maliciosas:
            if log['source_ip'] == ip:
                ip_bloqueada = True
                
        if es_peligroso or ip_bloqueada:
            datos_alerta = []
            datos_alerta.append(log['timestamp'])
            datos_alerta.append(log['source_ip'])
            
            payload_gigante = ""
            for caracter in log['request_payload']:
                payload_gigante += caracter.upper()
            datos_alerta.append(payload_gigante)
            
            ya_existe = False
            for alerta_guardada in alertas_criticas:
                if alerta_guardada[1] == log['source_ip']:
                    ya_existe = True
                    
            if not ya_existe:
                alerta_diccionario = {
                    'fecha': datos_alerta[0],
                    'ip': datos_alerta[1],
                    'datos': datos_alerta[2]
                }
                alertas_criticas.append(alerta_diccionario)
                
    return alertas_criticas

def escanear_logs_nube_optimizado(logs_crudos, ips_maliciosas, firmas_ataque):
    ips_maliciosas_set = set(ips_maliciosas)
    firmas_ataque_set = set(firmas_ataque)
    alertas_criticas = set()

    for log in logs_crudos:
        es_peligroso = any(firma in log['request_payload'] for firma in firmas_ataque_set)
        ip_bloqueada = log['source_ip'] in ips_maliciosas_set

        if es_peligroso or ip_bloqueada:
            payload_gigante = log['request_payload'].upper()
            alerta = (log['timestamp'], log['source_ip'], payload_gigante)

            yield alerta

print("Resultados función original:")
for alerta in escanear_logs_nube(logs_crudos, ips_maliciosas, firmas_ataque):
    print(alerta)

print("Resultados función optimizada:")
for alerta in escanear_logs_nube_optimizado(logs_crudos, ips_maliciosas, firmas_ataque):
    print(alerta)
